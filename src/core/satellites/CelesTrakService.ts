const BASE_URL = "https://celestrak.org";
const TIMEOUT_MS = 30_000;

export class CelesTrakHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`HTTP ${status}`);
    this.name = "CelesTrakHttpError";
    this.status = status;
  }
}

export class CelesTrakService {
  getGroup(key: string): Promise<unknown> {
    return this.getJson(
      `${BASE_URL}/NORAD/elements/gp.php?GROUP=${encodeURIComponent(key)}&FORMAT=JSON`,
    );
  }

  getObjectTypes(): Promise<unknown> {
    return this.getJson(
      `${BASE_URL}/satcat/records.php?GROUP=visual&FORMAT=JSON`,
    );
  }

  private async getJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) throw new CelesTrakHttpError(response.status);

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const celesTrakService = new CelesTrakService();
