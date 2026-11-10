// Pure feed helpers shared by the Local and Firestore backends. Keep this file
// free of runtime imports other than `.ts` siblings so Node tests can load it.
import type { PublishDraft } from "./communityRepository.ts";
import type { AuthorSnapshot, CommunityPost, FeedPage } from "./communityTypes.ts";
import { cellOf } from "./geoCells.ts";

export const FEED_PAGE_SIZE = 10;

export function comparePosts(a: CommunityPost, b: CommunityPost): number {
  return b.createdAt - a.createdAt || (a.id < b.id ? 1 : a.id === b.id ? 0 : -1);
}

export function encodeFeedCursor(createdAt: number, id: string): string {
  return JSON.stringify([createdAt, id]);
}

export function decodeFeedCursor(cursor?: string | null): [number, string] | null {
  if (!cursor) return null;
  let value: unknown;
  try {
    value = JSON.parse(cursor);
  } catch {
    throw new Error("Invalid feed cursor.");
  }
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== "number" ||
    !Number.isFinite(value[0]) ||
    typeof value[1] !== "string" ||
    !value[1] ||
    value[1].includes("/")
  ) {
    throw new Error("Invalid feed cursor.");
  }
  return [value[0], value[1]];
}

// Callers fetch FEED_PAGE_SIZE + 1 posts; the extra one only signals another page.
export function makeFeedPage(posts: CommunityPost[]): FeedPage {
  const page = posts.slice(0, FEED_PAGE_SIZE);
  const last = page[page.length - 1];
  return {
    posts: page,
    cursor: posts.length > FEED_PAGE_SIZE && last ? encodeFeedCursor(last.createdAt, last.id) : null,
  };
}

export function makePost(author: AuthorSnapshot, draft: PublishDraft, id: string): CommunityPost {
  const latitude = draft.latitude ?? null;
  const longitude = draft.longitude ?? null;
  return {
    id,
    author: { ...author },
    sightingId: draft.sightingId ?? null,
    caption: draft.caption.trim(),
    objectName: draft.objectName.trim(),
    photoUrl: draft.photoUrl,
    city: draft.city ?? null,
    latitude,
    longitude,
    cell: latitude !== null && longitude !== null ? cellOf(latitude, longitude) : null,
    createdAt: Date.now(),
    observedAt: draft.observedAt ?? null,
    starredBy: [],
    seenBy: [],
    commentCount: 0,
  };
}

// "Today" is UTC so the two backends agree across time zones.
export function todayStart(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}
