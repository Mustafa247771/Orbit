import { File, Paths } from "expo-file-system";
import { CelesTrakHttpError } from "./CelesTrakService";
import {
  isRecord,
  parseElements,
  type SatelliteElements,
} from "./SatelliteData";

export type ObjectKind = "payload" | "rocket" | "debris" | "unknown";

export type CatalogueObject = {
  id: number;
  name: string;
  kind: ObjectKind;
  elements: SatelliteElements;
};

export type Catalogue = {
  fetchedAt: number;
  updatedAt: number;
  objects: CatalogueObject[];
  brightIds: number[];
  warning: string | null;
};

export type CatalogueSnapshot = {
  catalogue: Catalogue | null;
  error: string | null;
};

export const CATALOGUE_TTL_MS = 2 * 60 * 60 * 1000;
const TYPE_TTL_MS = 24 * 60 * 60 * 1000;

const COLLECTIONS = [
  { key: "visual", label: "bright objects", kind: "unknown" },
  { key: "active", label: "active satellites", kind: "payload" },
  { key: "fengyun-1c-debris", label: "Fengyun debris", kind: "debris" },
  { key: "iridium-33-debris", label: "Iridium debris", kind: "debris" },
  { key: "cosmos-2251-debris", label: "Cosmos debris", kind: "debris" },
] as const;

type GroupCache = {
  fetchedAt: number;
  records: SatelliteElements[];
};

type TypeCache = {
  fetchedAt: number;
  kinds: Record<string, ObjectKind>;
};

export const OBJECT_LABELS: Record<ObjectKind, string> = {
  payload: "Satellite",
  rocket: "Rocket body",
  debris: "Debris",
  unknown: "Unknown object",
};

function fresh(fetchedAt: number | undefined, ttl: number) {
  if (fetchedAt === undefined || fetchedAt <= 0) return false;

  const age = Date.now() - fetchedAt;
  return age >= 0 && age < ttl;
}

function objectKind(value: unknown): ObjectKind {
  const type = String(value ?? "")
    .toUpperCase()
    .replace(/[ _-]/g, "");

  if (type === "PAY" || type === "PAYLOAD") return "payload";
  if (type === "R/B" || type === "ROCKETBODY") return "rocket";
  if (type === "DEB" || type === "DEBRIS") return "debris";

  return "unknown";
}

async function parseRecords(value: unknown): Promise<SatelliteElements[]> {
  if (!Array.isArray(value)) throw new Error("Invalid orbital collection.");

  const records: SatelliteElements[] = [];

  for (let index = 0; index < value.length; index++) {
    const raw = value[index];

    if (isRecord(raw)) {
      const elements = parseElements({
        ...raw,
        OBJECT_NAME:
          typeof raw.OBJECT_NAME === "string" && raw.OBJECT_NAME.trim()
            ? raw.OBJECT_NAME
            : "Object " + raw.NORAD_CAT_ID,
      });

      if (elements) records.push(elements);
    }

    if (index % 200 === 199)
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  if (!records.length) throw new Error("No usable orbital data was returned.");

  return records;
}

export class CatalogueRepository {
  private groups: Record<string, GroupCache> = {};
  private types: TypeCache = { fetchedAt: 0, kinds: {} };
  private catalogue: Catalogue | null = null;
  private ready: Promise<void> | null = null;
  private pending: Promise<CatalogueSnapshot> | null = null;
  private error: string | null = null;
  private saveError: string | null = null;
  private dirty = false;
  private paused = false;
  private retryAt = 0;

  private snapshot(): CatalogueSnapshot {
    return {
      catalogue: this.catalogue,
      error: [this.error, this.saveError].filter(Boolean).join(" ") || null,
    };
  }

  private combine() {
    const objects = new Map<number, CatalogueObject>();
    const timestamps: number[] = [];

    for (const collection of COLLECTIONS) {
      const group = this.groups[collection.key];
      if (!group) continue;

      timestamps.push(group.fetchedAt);

      for (const record of group.records) {
        const id = Number(record.NORAD_CAT_ID);
        const existing = objects.get(id);

        const elements =
          !existing || record.EPOCH > existing.elements.EPOCH
            ? record
            : existing.elements;

        const knownType = this.types.kinds[String(id)];

        const kind =
          (knownType !== "unknown" ? knownType : undefined) ??
          (collection.kind !== "unknown"
            ? collection.kind
            : (existing?.kind ?? "unknown"));

        objects.set(id, {
          id,
          name: elements.OBJECT_NAME,
          elements,
          kind,
        });
      }
    }

    this.catalogue = objects.size
      ? {
          fetchedAt: Math.min(...timestamps),
          updatedAt: Math.min(...timestamps),
          objects: [...objects.values()],
          brightIds: [
            ...new Set(
              (this.groups.visual?.records ?? []).map((item) =>
                Number(item.NORAD_CAT_ID),
              ),
            ),
          ],
          warning: COLLECTIONS.some((item) => !this.groups[item.key])
            ? "Some collections are unavailable. Showing the collections saved on this device."
            : null,
        }
      : null;
  }

  async readCached(): Promise<CatalogueSnapshot> {
    this.ready ??= (async () => {
      try {
        const file = new File(Paths.document, "celestrak-catalogue.json");

        if (!file.exists) return;

        const value: unknown = JSON.parse(await file.text());

        if (!isRecord(value) || value.version !== 1 || !isRecord(value.groups))
          throw new Error();

        for (const collection of COLLECTIONS) {
          const group = value.groups[collection.key];

          if (
            !isRecord(group) ||
            typeof group.fetchedAt !== "number" ||
            !Number.isFinite(group.fetchedAt)
          )
            continue;

          try {
            this.groups[collection.key] = {
              fetchedAt: group.fetchedAt,
              records: await parseRecords(group.records),
            };
          } catch {
            this.error = "Some saved orbital data could not be read.";
          }
        }

        if (
          isRecord(value.types) &&
          typeof value.types.fetchedAt === "number" &&
          Number.isFinite(value.types.fetchedAt) &&
          isRecord(value.types.kinds)
        ) {
          const kinds: Record<string, ObjectKind> = {};

          for (const [id, kind] of Object.entries(value.types.kinds))
            if (
              kind === "payload" ||
              kind === "rocket" ||
              kind === "debris" ||
              kind === "unknown"
            )
              kinds[id] = kind;

          this.types = {
            fetchedAt: Object.keys(kinds).length ? value.types.fetchedAt : 0,
            kinds,
          };
        }
      } catch {
        this.error = "The saved catalogue could not be read.";
      }

      this.combine();
    })();

    await this.ready;
    return this.snapshot();
  }

  private due() {
    const due: string[] = COLLECTIONS.filter(
      (item) => !fresh(this.groups[item.key]?.fetchedAt, CATALOGUE_TTL_MS),
    ).map((item) => item.key);

    if (!fresh(this.types.fetchedAt, TYPE_TTL_MS)) due.push("metadata");

    return due;
  }

  needsRefresh() {
    return (
      this.dirty ||
      (!this.paused && Date.now() >= this.retryAt && this.due().length > 0)
    );
  }

  refresh(retry = false): Promise<CatalogueSnapshot> {
    this.pending ??= this.update(retry).finally(() => {
      this.pending = null;
    });

    return this.pending;
  }

  private async getJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (response.status !== 200)
        throw new CelesTrakHttpError(response.status);

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async update(retry: boolean): Promise<CatalogueSnapshot> {
    await this.readCached();

    if (retry || (!this.paused && Date.now() >= this.retryAt)) {
      this.paused = false;
      this.error = null;

      for (const key of this.due()) {
        try {
          if (key === "metadata") {
            const payload = await this.getJson(
              "https://celestrak.org/satcat/records.php?GROUP=visual&FORMAT=JSON",
            );

            if (!Array.isArray(payload) || !payload.length)
              throw new Error("Invalid object classifications.");

            const kinds: Record<string, ObjectKind> = {};

            for (const item of payload) {
              if (!isRecord(item)) continue;

              const id = Number(item.NORAD_CAT_ID);

              if (Number.isSafeInteger(id) && id > 0)
                kinds[String(id)] = objectKind(item.OBJECT_TYPE);
            }

            if (!Object.keys(kinds).length)
              throw new Error("No usable classifications were returned.");

            this.types = {
              fetchedAt: Date.now(),
              kinds,
            };
          } else {
            const records = await parseRecords(
              await this.getJson(
                "https://celestrak.org/NORAD/elements/gp.php?GROUP=" +
                  encodeURIComponent(key) +
                  "&FORMAT=JSON",
              ),
            );

            this.groups[key] = {
              fetchedAt: Date.now(),
              records,
            };
          }

          this.dirty = true;
        } catch (error) {
          this.paused = error instanceof CelesTrakHttpError;
          this.retryAt = Date.now() + 5 * 60_000;

          const label =
            key === "metadata"
              ? "object classifications"
              : (COLLECTIONS.find((item) => item.key === key)?.label ?? key);

          if (error instanceof CelesTrakHttpError) {
            this.error =
              "CelesTrak could not update " +
              label +
              " (HTTP " +
              error.status +
              "). Automatic updates are paused. Please try again later.";
          } else if (error instanceof Error && error.name === "AbortError") {
            this.error =
              "The " + label + " download timed out. Please try again later.";
          } else {
            this.error =
              "The " +
              label +
              " data could not be updated. Please check your connection or try again later.";
          }

          break;
        }
      }
    }

    if (this.dirty) {
      this.combine();

      try {
        const file = new File(Paths.document, "celestrak-catalogue.json");
        const temporary = new File(
          Paths.document,
          "celestrak-catalogue.tmp.json",
        );

        temporary.create({
          overwrite: true,
          intermediates: true,
        });

        await temporary.write(
          JSON.stringify({
            version: 1,
            groups: this.groups,
            types: this.types,
          }),
        );
        await temporary.move(file, { overwrite: true });

        this.dirty = false;
        this.saveError = null;
      } catch {
        this.saveError =
          "The catalogue could not be saved. Check your device storage.";
      }
    }

    return this.snapshot();
  }
}

export const catalogueRepository = new CatalogueRepository();
