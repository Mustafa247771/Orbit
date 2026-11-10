import type { CommunityPost, Observer, PostComment } from "./communityTypes";

export const SCOPES = [
  { value: "global", label: "Global" },
  { value: "nearby", label: "Nearby" },
  { value: "following", label: "Following" },
] as const;

export type PostView = CommunityPost & {
  ago: string;
  own: boolean;
  starred: boolean;
  seen: boolean;
  following: boolean;
};

export type CommentView = PostComment & { ago: string; own: boolean };
export type ObserverView = Observer & {
  online: boolean;
  own: boolean;
  following: boolean;
};
