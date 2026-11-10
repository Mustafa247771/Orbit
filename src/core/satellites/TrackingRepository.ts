import { readJson, writeJson } from "@/core/storage/jsonFile";
import type { CatalogueMode } from "./catalogueFilters";
import { isRecord } from "./SatelliteData";

const FILE_NAME = "satellite-tracking.json";

export type TrackingPreferences = {
  mode: CatalogueMode | null;
  trackedIds: number[];
};

export class TrackingRepository {
  async read(): Promise<TrackingPreferences> {
    const value = await readJson(FILE_NAME);

    if (value === null) return { mode: null, trackedIds: [] };

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

  write(value: TrackingPreferences): Promise<void> {
    return writeJson(FILE_NAME, value);
  }
}

export const trackingRepository = new TrackingRepository();
