import type {
  AuthorSnapshot,
  CommunityPost,
  FeedPage,
  FeedScope,
  Observer,
  PostComment,
  PostDraft,
  ReportReason,
} from "./communityTypes";
import { FirestoreCommunityRepository } from "./FirestoreCommunityRepository";
import { LocalCommunityRepository } from "./LocalCommunityRepository";

// Windows cannot store CommunityRepository.ts alongside communityRepository.ts.
// Keep the contract and the lazy singleton together, using one import casing.
export type FeedOptions = {
  uid: string;
  cursor?: string | null;
  cells?: string[];
  followingUids?: string[];
};
export type PublishDraft = PostDraft & { photoUrl: string | null };
export type ObserverActivity = { observers: Observer[]; activeToday: number };

export interface CommunityRepository {
  listPosts(scope: FeedScope, options: FeedOptions): Promise<FeedPage>;
  createPost(author: AuthorSnapshot, draft: PublishDraft, id?: string): Promise<CommunityPost>;
  deletePost(postId: string): Promise<void>;
  toggleStar(postId: string, uid: string, on: boolean): Promise<void>;
  toggleSeen(postId: string, uid: string, on: boolean): Promise<void>;
  listComments(postId: string): Promise<PostComment[]>;
  addComment(postId: string, author: AuthorSnapshot, text: string): Promise<PostComment>;
  deleteComment(postId: string, commentId: string): Promise<void>;
  report(postId: string, reporterUid: string, reason: ReportReason, note: string): Promise<void>;
  listFollowing(uid: string): Promise<string[]>;
  setFollowing(uid: string, otherUid: string, on: boolean): Promise<void>;
  recentObservers(limit: number): Promise<ObserverActivity>;
  searchObservers(query: string): Promise<Observer[]>;
  touchPresence(observer: Observer): Promise<void>;
}

export const communityBackend: "firestore" | "local" =
  process.env.EXPO_PUBLIC_COMMUNITY_BACKEND === "local" ? "local" : "firestore";

// Both backends are imported eagerly. The Firebase app is only created on first use
// (getDb), so local mode still works without Firebase configuration.
export const communityRepository: CommunityRepository =
  communityBackend === "local"
    ? new LocalCommunityRepository()
    : new FirestoreCommunityRepository();
