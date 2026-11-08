import {
    CelesTrakHttpError,
    CelesTrakService,
    type SatelliteApi,
} from "./CelesTrakService";
import { SatelliteCache, type SatelliteStore } from "./SatelliteCache";
import type { CachedSatellite, SatelliteSnapshot } from "./SatelliteData";

export const DEFAULT_SATELLITE_IDS = [25544, 60289, 20580, 33591] as const;
export const SATELLITE_TTL_MS = 2 * 60 * 60 * 1000;

const RETRY_DELAY_MS = 5 * 60 * 1000;

export class SatelliteRepository {
  private satellites: CachedSatellite[] = [];
  private ready: Promise<void> | null = null;
  private pending: Promise<SatelliteSnapshot> | null = null;
  private networkError: string | null = null;
  private storageError: string | null = null;
  private retryAfter = 0;
  private automaticUpdatesPaused = false;
  private dirty = false;

  constructor(
    private readonly api: SatelliteApi = new CelesTrakService(),
    private readonly store: SatelliteStore = new SatelliteCache(),
    private readonly clock: () => number = Date.now,
    private readonly ids: readonly number[] = DEFAULT_SATELLITE_IDS,
  ) {}

  private snapshot(): SatelliteSnapshot {
    return {
      satellites: this.satellites,
      error:
        [this.networkError, this.storageError].filter(Boolean).join(" ") ||
        null,
    };
  }

  async readCached(): Promise<SatelliteSnapshot> {
    this.ready ??= this.store.read().then(
      (saved) => {
        this.satellites = saved.filter((item) =>
          this.ids.includes(Number(item.elements.NORAD_CAT_ID)),
        );
      },
      () => {
        this.storageError = "Saved satellite data could not be read.";
      },
    );

    await this.ready;

    return this.snapshot();
  }

  private dueIds(): number[] {
    const now = this.clock();

    return this.ids.filter((id) => {
      const saved = this.satellites.find(
        (item) => Number(item.elements.NORAD_CAT_ID) === id,
      );

      return (
        !saved ||
        saved.fetchedAt > now ||
        now - saved.fetchedAt >= SATELLITE_TTL_MS
      );
    });
  }

  needsRefresh(): boolean {
    return (
      this.dirty ||
      (!this.automaticUpdatesPaused &&
        this.clock() >= this.retryAfter &&
        this.dueIds().length > 0)
    );
  }

  refresh(retry = false): Promise<SatelliteSnapshot> {
    if (!this.pending) {
      this.pending = this.update(retry).finally(() => {
        this.pending = null;
      });
    }

    return this.pending;
  }

  private async update(retry: boolean): Promise<SatelliteSnapshot> {
    await this.readCached();

    const due = this.dueIds();

    if (
      due.length &&
      (retry ||
        (!this.automaticUpdatesPaused && this.clock() >= this.retryAfter))
    ) {
      this.automaticUpdatesPaused = false;
      this.networkError = null;

      for (const id of due) {
        try {
          const elements = await this.api.getById(id);

          this.satellites = [
            ...this.satellites.filter(
              (item) => Number(item.elements.NORAD_CAT_ID) !== id,
            ),
            { elements, fetchedAt: this.clock() },
          ];

          this.dirty = true;
        } catch (error) {
          this.networkError =
            error instanceof CelesTrakHttpError
              ? error.message
              : "Satellite data could not be updated. Check your connection and try again.";

          this.automaticUpdatesPaused = error instanceof CelesTrakHttpError;
          this.retryAfter = this.clock() + RETRY_DELAY_MS;

          // Stop this batch on failure; keep every previously valid record.
          break;
        }
      }
    }

    if (this.dirty) {
      try {
        await this.store.write(this.satellites);
        this.dirty = false;
        this.storageError = null;
      } catch {
        this.storageError =
          "Updated satellite data could not be saved. Check your device storage.";
      }
    }

    return this.snapshot();
  }
}

export const satelliteRepository = new SatelliteRepository();
