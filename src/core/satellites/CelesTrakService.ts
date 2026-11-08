import { parseElements, type SatelliteElements } from "./SatelliteData";

export interface SatelliteApi {
  getById(noradId: number): Promise<SatelliteElements>;
}

export class CelesTrakHttpError extends Error {
  constructor(readonly status: number) {
    super(
      "Satellite updates are temporarily unavailable. Please try again later.",
    );
    this.name = "CelesTrakHttpError";
  }
}

export class CelesTrakService implements SatelliteApi {
  constructor(private readonly request: typeof fetch = fetch) {}

  async getById(noradId: number): Promise<SatelliteElements> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await this.request(
        "https://celestrak.org/NORAD/elements/gp.php?CATNR=" +
          noradId +
          "&FORMAT=JSON",
        {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        },
      );

      if (response.status !== 200)
        throw new CelesTrakHttpError(response.status);

      const payload: unknown = await response.json();

      if (Array.isArray(payload)) {
        for (const item of payload) {
          const elements = parseElements(item);

          if (elements && Number(elements.NORAD_CAT_ID) === noradId)
            return elements;
        }
      }

      throw new Error(
        "No usable orbital data was returned for satellite " + noradId + ".",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
