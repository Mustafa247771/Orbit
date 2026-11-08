import { File, Paths } from "expo-file-system";

import { isRecord, parseElements, type CachedSatellite } from "./SatelliteData";

export interface SatelliteStore {
  read(): Promise<CachedSatellite[]>;
  write(satellites: CachedSatellite[]): Promise<void>;
}

export class SatelliteCache implements SatelliteStore {
  async read(): Promise<CachedSatellite[]> {
    const file = new File(Paths.document, "satellites.json");

    if (!file.exists) return [];

    const payload: unknown = JSON.parse(await file.text());

    if (
      !isRecord(payload) ||
      payload.version !== 1 ||
      !Array.isArray(payload.satellites)
    )
      throw new Error("Invalid satellite cache.");

    const valid = new Map<number, CachedSatellite>();

    for (const item of payload.satellites) {
      if (
        !isRecord(item) ||
        typeof item.fetchedAt !== "number" ||
        !Number.isFinite(item.fetchedAt) ||
        item.fetchedAt <= 0
      )
        continue;

      const elements = parseElements(item.elements);

      if (elements)
        valid.set(Number(elements.NORAD_CAT_ID), {
          elements,
          fetchedAt: item.fetchedAt,
        });
    }

    return [...valid.values()];
  }

  async write(satellites: CachedSatellite[]): Promise<void> {
    const file = new File(Paths.document, "satellites.json");
    const temporary = new File(Paths.document, "satellites.tmp.json");

    temporary.create({ overwrite: true, intermediates: true });

    await temporary.write(JSON.stringify({ version: 1, satellites }));
    await temporary.move(file, { overwrite: true });
  }
}
