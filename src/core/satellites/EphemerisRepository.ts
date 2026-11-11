import { fromSatelliteElements, type TrackedSatellite } from "@/core/orbit/propagate";
import { readJson, writeJson } from "@/core/storage/jsonFile";
import { isRecord, parseElements, type SatelliteElements } from "./SatelliteData";

const TTL = 3 * 60 * 60 * 1000;
const MAX_STALE = 2 * 24 * 60 * 60 * 1000;
const pending = new Map<number, Promise<EphemerisResult>>();
const memory = new Map<number, EphemerisResult>();
export type EphemerisResult = { satellite: TrackedSatellite; stale: boolean; epoch: string };

type Cached = { cachedAt: number; elements: SatelliteElements };

async function readCached(id: number): Promise<Cached | null> {
  try {
    const saved = await readJson(`orbit-elements-${id}.json`);
    if (!isRecord(saved) || typeof saved.cachedAt !== "number") return null;
    const elements = parseElements(saved.elements);
    return elements ? { cachedAt: saved.cachedAt, elements } : null;
  } catch { return null; }
}

async function load(id: number): Promise<EphemerisResult> {
  const cached = await readCached(id);
  if (cached && Date.now() - cached.cachedAt < TTL) {
    const result = { satellite: fromSatelliteElements(cached.elements), stale: false, epoch: cached.elements.EPOCH };
    memory.set(id, result);
    return result;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let response: Response;
    try {
      response = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${id}&FORMAT=JSON`, {
        headers: { Accept: "application/json" }, signal: controller.signal,
      });
    } finally { clearTimeout(timer); }
    if (!response.ok) throw new Error(`CelesTrak returned HTTP ${response.status}`);
    const body: unknown = await response.json();
    const elements = Array.isArray(body) ? parseElements(body[0]) : null;
    if (!elements) throw new Error(`No valid orbital elements were returned for NORAD ${id}.`);
    await writeJson(`orbit-elements-${id}.json`, { elements, cachedAt: Date.now() }).catch(() => undefined);
    const result = { satellite: fromSatelliteElements(elements), stale: false, epoch: elements.EPOCH };
    memory.set(id, result);
    return result;
  } catch (error) {
    if (cached && Date.now() - cached.cachedAt <= MAX_STALE) {
      return { satellite: fromSatelliteElements(cached.elements), stale: true, epoch: cached.elements.EPOCH };
    }
    throw error;
  }
}

export function getEphemeris(id: number): Promise<EphemerisResult> {
  const memo = memory.get(id);
  if (memo && Date.now() - Date.parse(memo.epoch) < 2 * 24 * 3600_000) {
    // Only reuse within the same short session; persistent freshness comes from the cache timestamp.
    if (pending.has(id)) return pending.get(id)!;
  }
  const job = pending.get(id) ?? load(id).finally(() => pending.delete(id));
  pending.set(id, job);
  return job;
}
