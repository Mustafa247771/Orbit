import { readJson, writeJson } from "@/core/storage/jsonFile";
import { isApodError } from "./Apod.ts";
import type { ApodEntry } from "./Apod.ts";
import { getDay, getRange } from "./ApodService";
import { anyEntry, emptyApodCache, freshEntry, mergeEntries, parseCache } from "./apodCache.ts";
import type { ApodCache } from "./apodCache.ts";
import { addDays } from "./apodDates.ts";
import { apodErrorMessage } from "./apodParsing.ts";

const FILE_NAME = "apod-cache.json";

export async function readCache(): Promise<ApodCache> {
  try {
    return parseCache(await readJson(FILE_NAME));
  } catch {
    return emptyApodCache(); // A corrupt cache is just a cold cache.
  }
}

export function writeCache(cache: ApodCache): Promise<void> {
  return writeJson(FILE_NAME, cache);
}

export type ApodDayResult = {
  entry: ApodEntry;
  /** "cache" only when loading failed and an older saved copy is shown instead. */
  source: "live" | "cache";
  /** Friendly message when live loading failed and a cached copy is shown instead. */
  error: string | null;
  /** The requested day when it is not published yet and the previous day is shown instead. */
  fallbackFrom: string | null;
};

export type ApodWeekResult = {
  /** In the order of the requested dates; days that could not be loaded are left out. */
  entries: ApodEntry[];
};

// Every read-merge-write goes through this queue, so two loads never overwrite each
// other's entries or share the temporary file.
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

// Re-reads the cache inside the queue, merges the new entries and saves. Saving is
// best effort: a full disk must not break showing a picture.
function remember(entries: ApodEntry[]): Promise<ApodCache> {
  return serialize(async () => {
    const merged = mergeEntries(await readCache(), entries, Date.now());
    try {
      await writeCache(merged);
    } catch {
      // Ignored on purpose.
    }
    return merged;
  });
}

// "out-of-range" counts as not published for a day that is today or later.
const notPublished = (error: unknown, date: string, today: string) =>
  isApodError(error) &&
  date >= today &&
  (error.code === "not-published" || error.code === "out-of-range");

async function loadDay(date: string, today: string, force = false): Promise<ApodDayResult> {
  if (!force) {
    const cached = freshEntry(await readCache(), date, today, Date.now());
    if (cached) return { entry: cached, source: "live", error: null, fallbackFrom: null };
  }

  try {
    const entry = await getDay(date);
    await remember([entry]);
    return { entry, source: "live", error: null, fallbackFrom: null };
  } catch (error) {
    if (notPublished(error, date, today)) {
      const previous = await loadDay(addDays(date, -1), today, force);
      return { ...previous, fallbackFrom: date };
    }
    const stale = anyEntry(await readCache(), date);
    if (stale) {
      return { entry: stale, source: "cache", error: apodErrorMessage(error), fallbackFrom: null };
    }
    throw error;
  }
}

async function loadWeek(dates: string[], today: string, force = false): Promise<ApodWeekResult> {
  if (dates.length === 0) return { entries: [] };
  const cache = await readCache();
  const now = Date.now();
  const pick = (from: ApodCache, stale: boolean): ApodEntry[] =>
    dates.flatMap((d) => {
      const entry = stale ? anyEntry(from, d) : freshEntry(from, d, today, now);
      return entry ? [entry] : [];
    });
  const missing = dates.filter((d) => force || !freshEntry(cache, d, today, now)).sort();
  if (missing.length === 0) return { entries: pick(cache, false) };

  const start = missing[0];
  let end = missing[missing.length - 1];
  try {
    let fetched: ApodEntry[];
    try {
      fetched = await getRange(start, end);
    } catch (error) {
      // The newest day may simply not be published yet; ask for everything before it.
      const earlier = addDays(end, -1);
      if (!(notPublished(error, end, today) && earlier >= start)) throw error;
      end = earlier;
      fetched = await getRange(start, end);
    }
    return { entries: pick(await remember(fetched), true) };
  } catch (error) {
    const entries = pick(await readCache(), true);
    if (entries.length === 0) throw error;
    return { entries };
  }
}

export const apodRepository = { loadDay, loadWeek };
