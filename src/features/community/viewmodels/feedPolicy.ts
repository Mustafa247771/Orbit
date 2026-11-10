import type { CommunityPost, FeedScope } from "../model/communityTypes.ts";
import { distanceKm, NEARBY_RADIUS_KM } from "../model/geoCells.ts";

type Location = { latitude: number; longitude: number };

export function isFeedOfflineError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  const code = typeof error.code === "string" ? error.code.replace(/^firestore\//, "") : "";
  return code === "unavailable" || code === "deadline-exceeded";
}

export function feedEmptyMessage(
  uid: string | null,
  scope: FeedScope,
  hasLocation: boolean,
  followingCount: number,
): string {
  if (!uid) return "Sign in to see and share community sightings.";
  if (scope === "nearby" && !hasLocation)
    return "Add a default location in Profile to find sightings near you.";
  if (scope === "following" && !followingCount)
    return "Follow observers using search to see their sightings here.";
  return scope === "nearby"
    ? `No sightings within ${NEARBY_RADIUS_KM} km yet. Share what you saw tonight.`
    : "No sightings here yet. Share what you saw tonight.";
}

// Apply the same policy to server pages, saved pages, and newly published posts.
export function matchesFeedScope(
  post: CommunityPost,
  scope: FeedScope,
  location: Location | null,
  following: readonly string[],
): boolean {
  if (scope === "global") return true;
  if (scope === "following") return following.includes(post.author.uid);
  if (!location || post.latitude === null || post.longitude === null) return false;
  return (
    distanceKm(location, {
      latitude: post.latitude,
      longitude: post.longitude,
    }) <= NEARBY_RADIUS_KM
  );
}

// Prefer the first occurrence so an overlapping page cannot undo a local change.
export function mergeFeedPosts(
  preferred: CommunityPost[],
  incoming: CommunityPost[],
): CommunityPost[] {
  const unique = new Map<string, CommunityPost>();
  for (const post of [...preferred, ...incoming]) {
    if (!unique.has(post.id)) unique.set(post.id, post);
  }
  return [...unique.values()];
}
