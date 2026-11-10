export type FeedScope = "global" | "nearby" | "following";

export type AuthorSnapshot = {
  uid: string;
  name: string;
  initials: string;
  rank: string;
};

export type CommunityPost = {
  id: string;
  author: AuthorSnapshot;
  sightingId: string | null;
  objectName: string;
  caption: string;
  photoUrl: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  cell: string | null;
  createdAt: number;
  observedAt: number | null;
  starredBy: string[];
  seenBy: string[];
  commentCount: number;
};

export type PostComment = {
  id: string;
  postId: string;
  author: AuthorSnapshot;
  text: string;
  createdAt: number;
};

export type Observer = {
  uid: string;
  name: string;
  initials: string;
  rank: string;
  lastActiveAt: number;
};

export type PostDraft = {
  caption: string;
  objectName: string;
  sightingId?: string;
  photoUri?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  observedAt?: number;
};

export type ReportReason = "spam" | "offensive" | "misleading" | "other";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "offensive", label: "Offensive" },
  { value: "misleading", label: "Misleading" },
  { value: "other", label: "Something else" },
];

export type FeedPage = {
  posts: CommunityPost[];
  cursor: string | null;
};
