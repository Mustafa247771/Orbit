import { toTrackedSatellite, type TrackedSatellite } from "@/core/orbit/propagate";
import { readJson, writeJson } from "@/core/storage/jsonFile";
import type { SatelliteTle } from "./types";

const CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const STALE_LIMIT_MS = 48 * 60 * 60 * 1000;
const cachedRequests = new Map<number, Promise<EphemerisResult>>();

type CachedTle = { cachedAt: number; tle: SatelliteTle };
export type EphemerisResult = { satellite: TrackedSatellite; stale: boolean; epoch: string };

function parseTle(source: string, id: number): SatelliteTle {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const one = lines.find((line) => line.startsWith("1 "));
  const two = lines.find((line) => line.startsWith("2 "));
  if (!one || !two || one.slice(2, 7).trim() !== String(id) || two.slice(2, 7).trim() !== String(id)) {
    throw new Error(`No valid TLE was returned for NORAD ${id}.`);
  }
  const title = lines.find((line) => !line.startsWith("1 ") && !line.startsWith("2 "));
  return { noradId: id, name: title?.replace(/^0 /, "") ?? (id === 25544 ? "ISS (ZARYA)" : `NORAD ${id}`), line1: one, line2: two };
}

function asResult(tle: SatelliteTle, stale: boolean): EphemerisResult {
  // The epoch substring is UTC day-of-year in a TLE, not an ISO timestamp.
  return { satellite: toTrackedSatellite(tle), stale, epoch: tle.line1.slice(18, 32).trim() };
}

async function loadEphemeris(id: number): Promise<EphemerisResult> {
  const filename = `orbit-tle-${id}.json`;
  let cache: CachedTle | null = null;
  try {
    const value = await readJson(filename) as CachedTle;
    if (value?.tle?.noradId === id && value.tle.line1 && value.tle.line2 && Number.isFinite(value.cachedAt)) cache = value;
  } catch { /* No cache yet. */ }
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) return asResult(cache.tle, false);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${id}&FORMAT=TLE`, { signal: controller.signal });
    if (!response.ok) throw new Error(`CelesTrak returned HTTP ${response.status}.`);
    const tle = parseTle(await response.text(), id);
    await writeJson(filename, { cachedAt: Date.now(), tle }).catch(() => undefined);
    return asResult(tle, false);
  } catch (error) {
    if (cache && Date.now() - cache.cachedAt < STALE_LIMIT_MS) return asResult(cache.tle, true);
    throw error;
  } finally { clearTimeout(timer); }
}

export function getEphemeris(id: number): Promise<EphemerisResult> {
  if (!Number.isSafeInteger(id) || id < 1) return Promise.reject(new Error("Invalid NORAD ID."));
  const previous = cachedRequests.get(id);
  if (previous) return previous;
  const request = loadEphemeris(id).finally(() => cachedRequests.delete(id));
  cachedRequests.set(id, request);
  return request;
}
