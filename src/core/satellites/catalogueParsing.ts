import { CelesTrakHttpError } from "./CelesTrakService";
import {
  COLLECTIONS,
  type Catalogue,
  type CatalogueObject,
  type Group,
  type ObjectKind,
  type Types,
} from "./catalogueTypes";
import {
  isRecord,
  parseElements,
  type SatelliteElements,
} from "./SatelliteData";

function objectKind(value: unknown): ObjectKind {
  const type = String(value ?? "")
    .toUpperCase()
    .replace(/[ _-]/g, "");

  if (type === "PAY" || type === "PAYLOAD") return "payload";
  if (type === "R/B" || type === "ROCKETBODY") return "rocket";
  if (type === "DEB" || type === "DEBRIS") return "debris";

  return "unknown";
}

export function failureMessage(label: string, error: unknown) {
  if (error instanceof CelesTrakHttpError)
    return `CelesTrak could not update ${label} (HTTP ${error.status}). Automatic updates are paused. Please try again later.`;

  if (error instanceof Error && error.name === "AbortError")
    return `The ${label} download timed out. Please try again later.`;

  return `The ${label} data could not be updated. Please check your connection or try again later.`;
}

export async function parseRecords(
  value: unknown,
): Promise<SatelliteElements[]> {
  if (!Array.isArray(value)) throw new Error("Invalid orbital collection.");

  const records: SatelliteElements[] = [];

  for (let index = 0; index < value.length; index++) {
    const raw = value[index];

    if (isRecord(raw)) {
      const name = typeof raw.OBJECT_NAME === "string" ? raw.OBJECT_NAME : "";
      const elements = parseElements({
        ...raw,
        OBJECT_NAME: name.trim() ? name : `Object ${raw.NORAD_CAT_ID}`,
      });

      if (elements) records.push(elements);
    }

    // Let the UI breathe while parsing thousands of records.
    if (index % 200 === 199) await new Promise((r) => setTimeout(r, 0));
  }

  if (!records.length) throw new Error("No usable orbital data was returned.");

  return records;
}

export function parseKinds(value: unknown): Record<string, ObjectKind> {
  if (!Array.isArray(value)) throw new Error("Invalid object classifications.");

  const kinds: Record<string, ObjectKind> = {};

  for (const item of value) {
    if (!isRecord(item)) continue;

    const id = Number(item.NORAD_CAT_ID);

    if (Number.isSafeInteger(id) && id > 0)
      kinds[id] = objectKind(item.OBJECT_TYPE);
  }

  if (!Object.keys(kinds).length)
    throw new Error("No usable classifications were returned.");

  return kinds;
}

export function buildCatalogue(
  groups: Record<string, Group>,
  types: Types,
): Catalogue | null {
  const objects = new Map<number, CatalogueObject>();

  for (const collection of COLLECTIONS) {
    for (const record of groups[collection.key]?.records ?? []) {
      const id = Number(record.NORAD_CAT_ID);
      const existing = objects.get(id);

      // Newest EPOCH wins (ISO strings compare chronologically).
      const elements =
        existing && record.EPOCH <= existing.elements.EPOCH
          ? existing.elements
          : record;

      // Priority: SATCAT type, then collection kind, then what we had.
      const known = types.kinds[id];
      const kind =
        known && known !== "unknown"
          ? known
          : collection.kind !== "unknown"
            ? collection.kind
            : (existing?.kind ?? "unknown");

      objects.set(id, { id, name: elements.OBJECT_NAME, kind, elements });
    }
  }

  if (!objects.size) return null;

  const saved = COLLECTIONS.filter((item) => groups[item.key]);
  const bright = groups.visual?.records ?? [];

  return {
    updatedAt: Math.min(...saved.map((item) => groups[item.key].fetchedAt)),
    objects: [...objects.values()],
    brightIds: [...new Set(bright.map((item) => Number(item.NORAD_CAT_ID)))],
    warning:
      saved.length < COLLECTIONS.length
        ? "Some collections are unavailable. Showing the collections saved on this device."
        : null,
  };
}
