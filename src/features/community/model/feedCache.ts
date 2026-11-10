import { readJson, writeJson } from "@/core/storage/jsonFile";
import { FEED_PAGE_SIZE } from "./feedPaging";
import type { CommunityPost, FeedScope } from "./communityTypes";

const fileName = (uid: string, scope: FeedScope) => `community-feed-${uid}-${scope}.json`;
let pending: Promise<void> = Promise.resolve();

export async function readFeedCache(uid: string, scope: FeedScope): Promise<CommunityPost[]> {
  await pending;
  const posts = await readJson(fileName(uid, scope));
  return Array.isArray(posts) ? (posts as CommunityPost[]).slice(0, FEED_PAGE_SIZE) : [];
}

export function writeFeedCache(
  uid: string,
  scope: FeedScope,
  posts: CommunityPost[],
): Promise<void> {
  const page = posts.slice(0, FEED_PAGE_SIZE);
  const result = pending.then(() => writeJson(fileName(uid, scope), page));
  pending = result.catch(() => undefined);
  return result;
}
