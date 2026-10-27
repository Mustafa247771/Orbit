import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Share } from "react-native";

import { timeAgo } from "@/core/time/timeAgo";
import { SAMPLE_PROFILE } from "@/features/profile/model/Profile";
import { sightingRepository } from "@/features/sightings/model/LocalSightingRepository";
import type { Sighting } from "@/features/sightings/model/Sighting";
import type { Comment, Post } from "../model/Post";
import {
  MORE_OBSERVERS,
  OBSERVERS,
  OBSERVERS_UNDER_CLEAR_SKIES,
  samplePosts,
} from "../model/samplePosts";

export const SCOPES = [
  { value: "global", label: "Global" },
  { value: "nearby", label: "Nearby" },
  { value: "following", label: "Following" },
] as const;

export type FeedScope = (typeof SCOPES)[number]["value"];
export type CommentView = Comment & { ago: string };
export type PostView = Omit<Post, "comments"> & {
  comments: CommentView[];
  meta: string;
  starred: boolean;
  starCount: number;
  seen: boolean;
  seenCount: number;
};

const YOU = {
  name: "You",
  initials: SAMPLE_PROFILE.name
    .split(" ")
    .map((part) => part[0])
    .join(""),
  rank: SAMPLE_PROFILE.rank,
};

function sightingToPost(sighting: Sighting): Post {
  return {
    id: `mine-${sighting.id}`,
    author: YOU,
    city: sighting.location?.cityLabel ?? "Unknown location",
    postedAt: sighting.observedAt,
    object: sighting.objectName,
    caption: sighting.caption || "Logged a new sighting.",
    photoUri: sighting.photoUri,
    photoCredit: null,
    pass: null,
    details: "Your sighting",
    verified: false,
    stars: 0,
    seenBy: 0,
    comments: [],
    nearby: true,
    following: true,
  };
}

function toggleIn(set: ReadonlySet<string>, id: string) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function useCommunityViewModel() {
  const [now] = useState(() => Date.now());
  const samples = useMemo(() => samplePosts(now), [now]);
  const [mine, setMine] = useState<Post[]>([]);
  const [scope, setScope] = useState<FeedScope>("global");
  const [starred, setStarred] = useState<ReadonlySet<string>>(() => new Set());
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [commentsFor, setCommentsFor] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      sightingRepository
        .list()
        .then((sightings) =>
          setMine(
            sightings
              .filter((sighting) => sighting.visibility === "community")
              .map(sightingToPost),
          ),
        );
    }, []),
  );

  const feed = useMemo<PostView[]>(() => {
    const visible = [...mine, ...samples].filter(
      (post) =>
        scope === "global" ||
        (scope === "nearby" ? post.nearby : post.following),
    );
    return visible.map((post) => {
      const isStarred = starred.has(post.id);
      const isSeen = seen.has(post.id);
      return {
        ...post,
        comments: [...post.comments, ...(replies[post.id] ?? [])].map(
          (comment) => ({ ...comment, ago: timeAgo(comment.postedAt, now) }),
        ),
        meta: `${post.city} · ${timeAgo(post.postedAt, now)}`,
        starred: isStarred,
        starCount: post.stars + (isStarred ? 1 : 0),
        seen: isSeen,
        seenCount: post.seenBy + (isSeen ? 1 : 0),
      };
    });
  }, [mine, samples, scope, starred, seen, replies, now]);

  const toggleStar = useCallback((id: string) => {
    setStarred((current) => toggleIn(current, id));
  }, []);

  const toggleSeen = useCallback((id: string) => {
    setSeen((current) => toggleIn(current, id));
  }, []);

  const addComment = useCallback((postId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const comment: Comment = {
      id: `${postId}-${Date.now()}`,
      author: YOU.name,
      initials: YOU.initials,
      text: trimmed,
      postedAt: new Date().toISOString(),
    };
    setReplies((current) => ({
      ...current,
      [postId]: [...(current[postId] ?? []), comment],
    }));
  }, []);

  const share = useCallback((post: PostView) => {
    Share.share({
      message: `${post.author.name} spotted ${post.object} from ${post.city} on Orbit.`,
    });
  }, []);

  const logSighting = useCallback(() => router.push("/sightings/new"), []);

  return {
    scope,
    setScope,
    feed,
    observers: OBSERVERS,
    moreObservers: MORE_OBSERVERS,
    clearSkies: OBSERVERS_UNDER_CLEAR_SKIES,
    toggleStar,
    toggleSeen,
    share,
    logSighting,
    commentsPost: feed.find((post) => post.id === commentsFor) ?? null,
    openComments: setCommentsFor,
    closeComments: () => setCommentsFor(null),
    addComment,
    myInitials: YOU.initials,
  };
}
