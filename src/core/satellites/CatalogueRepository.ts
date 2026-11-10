import { readJson, writeJson } from "@/core/storage/jsonFile";
import { celesTrakService, CelesTrakHttpError } from "./CelesTrakService";
import {
  buildCatalogue,
  failureMessage,
  parseKinds,
  parseRecords,
} from "./catalogueParsing";
import {
  COLLECTIONS,
  type Catalogue,
  type CatalogueSnapshot,
  type Group,
  type Types,
} from "./catalogueTypes";

type SavedFile = {
  version: number;
  groups: Record<string, Group>;
  types: Types;
};

const FILE_NAME = "celestrak-catalogue.json";
const GROUP_TTL_MS = 2 * 60 * 60 * 1000;
const TYPES_TTL_MS = 24 * 60 * 60 * 1000;
const RETRY_DELAY_MS = 5 * 60_000;

function fresh(fetchedAt: number | undefined, ttl: number) {
  const age = Date.now() - (fetchedAt ?? 0);

  return age >= 0 && age < ttl;
}

export class CatalogueRepository {
  private groups: Record<string, Group> = {};
  private types: Types = { fetchedAt: 0, kinds: {} };
  private catalogue: Catalogue | null = null;
  private ready: Promise<void> | null = null;
  private pending: Promise<CatalogueSnapshot> | null = null;
  private error: string | null = null;
  private saveError: string | null = null;
  private dirty = false;
  // Earliest time an automatic refresh may run again; Infinity after an HTTP error.
  private retryAt = 0;

  async readCached(): Promise<CatalogueSnapshot> {
    this.ready ??= this.load();
    await this.ready;

    return this.snapshot();
  }

  needsRefresh() {
    return this.dirty || (Date.now() >= this.retryAt && this.due().length > 0);
  }

  refresh(retry = false): Promise<CatalogueSnapshot> {
    this.pending ??= this.update(retry).finally(() => {
      this.pending = null;
    });

    return this.pending;
  }

  private snapshot(): CatalogueSnapshot {
    return {
      catalogue: this.catalogue,
      error: [this.error, this.saveError].filter(Boolean).join(" ") || null,
    };
  }

  private due() {
    const due: string[] = COLLECTIONS.filter(
      (item) => !fresh(this.groups[item.key]?.fetchedAt, GROUP_TTL_MS),
    ).map((item) => item.key);

    if (!fresh(this.types.fetchedAt, TYPES_TTL_MS)) due.push("types");

    return due;
  }

  // Only this repository writes the file, so apart from its version it is trusted.
  private async load() {
    try {
      const saved = (await readJson(FILE_NAME)) as SavedFile | null;

      if (saved) {
        if (saved.version !== 1) throw new Error("Unknown catalogue version.");

        for (const { key } of COLLECTIONS) {
          const group = saved.groups[key];

          if (group)
            this.groups[key] = {
              fetchedAt: group.fetchedAt,
              records: await parseRecords(group.records),
            };
        }

        this.types = {
          fetchedAt: saved.types.fetchedAt,
          kinds: { ...saved.types.kinds },
        };
      }
    } catch {
      this.error = "The saved catalogue could not be read.";
    }

    this.catalogue = buildCatalogue(this.groups, this.types);
  }

  private async fetchOne(key: string) {
    if (key === "types") {
      const kinds = parseKinds(await celesTrakService.getObjectTypes());

      this.types = { fetchedAt: Date.now(), kinds };
    } else {
      const records = await parseRecords(await celesTrakService.getGroup(key));

      this.groups[key] = { fetchedAt: Date.now(), records };
    }
  }

  private async update(retry: boolean): Promise<CatalogueSnapshot> {
    await this.readCached();

    if (retry || Date.now() >= this.retryAt) {
      this.error = null;
      this.retryAt = 0;

      for (const key of this.due()) {
        try {
          await this.fetchOne(key);
          this.dirty = true;
        } catch (error) {
          const label =
            COLLECTIONS.find((item) => item.key === key)?.label ??
            "object classifications";

          this.retryAt =
            error instanceof CelesTrakHttpError
              ? Infinity
              : Date.now() + RETRY_DELAY_MS;
          this.error = failureMessage(label, error);
          break;
        }
      }
    }

    if (this.dirty) {
      this.catalogue = buildCatalogue(this.groups, this.types);

      try {
        await writeJson(FILE_NAME, {
          version: 1,
          groups: this.groups,
          types: this.types,
        });
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
