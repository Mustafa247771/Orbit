import {
  migrateLocalFile,
  readAccountDoc,
  writeAccountDoc,
} from "@/core/storage/cloudDoc";
import { readJson, writeJson } from "@/core/storage/jsonFile";
import type { CatalogueMode } from "./catalogueFilters";
import { isRecord } from "./SatelliteData";

const FILE_NAME = "satellite-tracking.json";
const DOC_NAME = "tracking";

export type TrackingPreferences = {
  mode: CatalogueMode | null;
  trackedIds: number[];
};

// `unsynced` is true when the data only lives on this phone for now.
export type TrackingRead = { preferences: TrackingPreferences; unsynced: boolean };
export type TrackingWrite = { unsynced: boolean };

const DEFAULTS = (): TrackingPreferences => ({ mode: null, trackedIds: [] });

function parseStrict(value: unknown): TrackingPreferences {
  if (value === null || value === undefined) return DEFAULTS();

  if (
    !isRecord(value) ||
    !Array.isArray(value.trackedIds) ||
    (value.mode !== null &&
      value.mode !== "all" &&
      value.mode !== "bright" &&
      value.mode !== "tracked")
  )
    throw new Error("Saved tracking settings could not be read.");

  const trackedIds = value.trackedIds.filter(
    (id): id is number =>
      typeof id === "number" && Number.isSafeInteger(id) && id > 0,
  );

  return { mode: value.mode, trackedIds: [...new Set(trackedIds)] };
}

// Pure: defaults for nothing saved or unreadable data.
export function parseTrackingPreferences(raw: unknown): TrackingPreferences {
  try {
    return parseStrict(raw);
  } catch {
    return DEFAULTS();
  }
}

const migrated = new Set<string>();

export class TrackingRepository {
  async read(uid: string | null): Promise<TrackingRead> {
    if (uid === null) {
      return {
        preferences: parseStrict(await readJson(FILE_NAME)),
        unsynced: false,
      };
    }

    if (!migrated.has(uid)) {
      await migrateLocalFile(uid, DOC_NAME, FILE_NAME, parseTrackingPreferences);
      migrated.add(uid);
    }

    const result = await readAccountDoc(uid, DOC_NAME, parseTrackingPreferences);

    return { preferences: result.value, unsynced: result.source === "cache" };
  }

  async write(
    uid: string | null,
    value: TrackingPreferences,
  ): Promise<TrackingWrite> {
    if (uid === null) {
      await writeJson(FILE_NAME, value);
      return { unsynced: false };
    }

    const result = await writeAccountDoc(uid, DOC_NAME, value);

    return { unsynced: !result.synced };
  }
}

export const trackingRepository = new TrackingRepository();
