import type { ApodEntry, ApodKind } from "./Apod.ts";
import { isValidIsoDate } from "./apodDates.ts";

export type ApodFavorite = {
  date: string;
  title: string;
  kind: ApodKind;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  savedAt: number;
};

export const MAX_FAVORITES = 200;

export function toFavorite(entry: ApodEntry, now: number): ApodFavorite {
  return {
    date: entry.date,
    title: entry.title,
    kind: entry.kind,
    thumbnailUrl: entry.thumbnailUrl,
    imageUrl: entry.imageUrl,
    savedAt: now,
  };
}

export const isFavorite = (list: ApodFavorite[], date: string): boolean =>
  list.some((item) => item.date === date);

// Newest saved first, trimmed to the cap.
function tidy(list: ApodFavorite[]): ApodFavorite[] {
  return [...list].sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_FAVORITES);
}

export function toggleFavorite(
  list: ApodFavorite[],
  entry: ApodEntry,
  now: number,
): ApodFavorite[] {
  if (isFavorite(list, entry.date)) return list.filter((item) => item.date !== entry.date);
  return tidy([toFavorite(entry, now), ...list]);
}

const KINDS: ApodKind[] = ["image", "video", "other"];

const url = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

function parseFavorite(raw: unknown): ApodFavorite | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const kind = KINDS.find((k) => k === item.kind);
  if (typeof item.date !== "string" || !isValidIsoDate(item.date)) return null;
  if (typeof item.title !== "string" || item.title.length === 0 || !kind) return null;
  if (typeof item.savedAt !== "number" || !Number.isFinite(item.savedAt)) return null;
  return {
    date: item.date,
    title: item.title,
    kind,
    thumbnailUrl: url(item.thumbnailUrl),
    imageUrl: url(item.imageUrl),
    savedAt: item.savedAt,
  };
}

// Tolerant: invalid items are dropped; duplicates keep the most recently saved copy.
export function parseFavorites(raw: unknown): ApodFavorite[] {
  if (!Array.isArray(raw)) return [];
  const byDate = new Map<string, ApodFavorite>();
  for (const value of raw) {
    const favorite = parseFavorite(value);
    if (!favorite) continue;
    const existing = byDate.get(favorite.date);
    if (!existing || favorite.savedAt > existing.savedAt) byDate.set(favorite.date, favorite);
  }
  return tidy([...byDate.values()]);
}
