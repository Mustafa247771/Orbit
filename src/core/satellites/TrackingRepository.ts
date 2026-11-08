import { File, Paths } from "expo-file-system";
import type { CatalogueObject } from "./CatalogueRepository";
import { isRecord } from "./SatelliteData";

export type CatalogueMode = "all" | "bright" | "tracked";

export type TrackingPreferences = {
  mode: CatalogueMode | null;
  trackedIds: number[];
};

export const CATALOGUE_MODES = [
  { value: "all", label: "All available" },
  { value: "bright", label: "Bright" },
  { value: "tracked", label: "Tracked" },
] as const;

export function matchesMode(
  id: number,
  mode: CatalogueMode | null,
  tracked: ReadonlySet<number>,
  bright: ReadonlySet<number>,
) {
  return (
    mode === "all" ||
    (mode === "bright" && bright.has(id)) ||
    (mode === "tracked" && tracked.has(id))
  );
}

export function searchCatalogue(objects: CatalogueObject[], query: string) {
  const normalized = query.trim().toLowerCase();

  return normalized
    ? objects
        .filter(
          (item) =>
            item.name.toLowerCase().includes(normalized) ||
            String(item.id).includes(normalized),
        )
        .slice(0, 50)
    : [];
}

export class TrackingRepository {
  async read(): Promise<TrackingPreferences> {
    const file = new File(Paths.document, "satellite-tracking.json");

    if (!file.exists) return { mode: null, trackedIds: [] };

    const value: unknown = JSON.parse(await file.text());

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

    return {
      mode: value.mode,
      trackedIds: [...new Set(trackedIds)],
    };
  }

  async write(value: TrackingPreferences): Promise<void> {
    const file = new File(Paths.document, "satellite-tracking.json");
    const temporary = new File(Paths.document, "satellite-tracking.tmp.json");

    temporary.create({
      overwrite: true,
      intermediates: true,
    });

    await temporary.write(JSON.stringify(value));
    await temporary.move(file, { overwrite: true });
  }
}

export const trackingRepository = new TrackingRepository();
