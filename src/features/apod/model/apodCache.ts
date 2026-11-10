import type { ApodEntry, ApodKind } from "./Apod.ts";
import { isValidIsoDate } from "./apodDates.ts";
import { isPlaceholderEntry } from "./apodPageParsing.ts";

export type ApodCacheItem = { entry: ApodEntry; fetchedAt: number };
export type ApodCache = { version: 1; entries: Record<string, ApodCacheItem> };

export const MAX_CACHED_ENTRIES = 60;
const TODAY_TTL_MS = 3_600_000;

export const emptyApodCache = (): ApodCache => ({ version: 1, entries: {} });

// Evicts the entries fetched longest ago, so browsing old days still caches. Entries
// merged just now are kept first.
function capped(
  entries: Record<string, ApodCacheItem>,
  keep: ReadonlySet<string> = new Set(),
): Record<string, ApodCacheItem> {
  const dates = Object.keys(entries).sort((a, b) => {
    const pinned = Number(keep.has(b)) - Number(keep.has(a));
    if (pinned !== 0) return pinned;
    const age = entries[b].fetchedAt - entries[a].fetchedAt;
    return age !== 0 ? age : a < b ? 1 : -1;
  });
  const kept: Record<string, ApodCacheItem> = {};
  for (const date of dates.slice(0, MAX_CACHED_ENTRIES)) kept[date] = entries[date];
  return kept;
}

export function mergeEntries(cache: ApodCache, entries: ApodEntry[], now: number): ApodCache {
  const merged = { ...cache.entries };
  const real = entries.filter((entry) => !isPlaceholderEntry(entry)); // Never keep the logo stand-in.
  for (const entry of real) merged[entry.date] = { entry, fetchedAt: now };
  return { version: 1, entries: capped(merged, new Set(real.map((e) => e.date))) };
}

// Past days never change; today's picture may be replaced, so it expires after an hour.
export function freshEntry(
  cache: ApodCache,
  date: string,
  today: string,
  now: number,
): ApodEntry | null {
  const item = cache.entries[date];
  if (!item || isPlaceholderEntry(item.entry)) return null;
  if (date < today) return item.entry;
  const age = now - item.fetchedAt;
  return age >= 0 && age < TODAY_TTL_MS ? item.entry : null;
}

// Stale fallback for when the network fails.
export function anyEntry(cache: ApodCache, date: string): ApodEntry | null {
  const entry = cache.entries[date]?.entry;
  return entry && !isPlaceholderEntry(entry) ? entry : null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const KINDS: ApodKind[] = ["image", "video", "other"];

function parseStoredEntry(raw: unknown): ApodEntry | null {
  if (!isRecord(raw)) return null;
  const date = str(raw.date);
  const title = str(raw.title);
  const pageUrl = str(raw.pageUrl);
  const kind = KINDS.find((k) => k === raw.kind);
  if (!date || !isValidIsoDate(date) || !title || !pageUrl || !kind) return null;
  return {
    date,
    title,
    explanation: typeof raw.explanation === "string" ? raw.explanation : "",
    kind,
    imageUrl: str(raw.imageUrl),
    hdUrl: str(raw.hdUrl),
    videoUrl: str(raw.videoUrl),
    thumbnailUrl: str(raw.thumbnailUrl),
    copyright: str(raw.copyright),
    pageUrl,
  };
}

// Tolerant: anything unreadable becomes an empty cache, bad items are dropped.
export function parseCache(raw: unknown): ApodCache {
  if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.entries)) return emptyApodCache();
  const entries: Record<string, ApodCacheItem> = {};
  for (const [key, value] of Object.entries(raw.entries)) {
    if (!isRecord(value)) continue;
    const entry = parseStoredEntry(value.entry);
    const fetchedAt = value.fetchedAt;
    if (!entry || entry.date !== key || isPlaceholderEntry(entry)) continue;
    if (typeof fetchedAt !== "number" || !Number.isFinite(fetchedAt)) continue;
    entries[key] = { entry, fetchedAt };
  }
  return { version: 1, entries: capped(entries) };
}
