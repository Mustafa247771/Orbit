import { router } from "expo-router";
import { useCallback, useMemo } from "react";

import { RANK } from "@/features/achievements/model/sampleAchievements";
import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import { initialsOf, nameOf } from "@/features/profile/model/profileNames";
import { useAccountProfile } from "@/features/profile/viewmodels/ProfileProvider";
import { communityBackend } from "../model/communityRepository";
import type { AuthorSnapshot } from "../model/communityTypes";
import type { CommentView, ObserverView, PostView } from "../model/communityViews";
import { formatAgo } from "../model/formatAgo";
import { useAutoPublish } from "./useAutoPublish";
import { useComments } from "./useComments";
import { useCompose } from "./useCompose";
import { useFeed } from "./useFeed";
import { useFollowing } from "./useFollowing";
import { useObserverSearch } from "./useObserverSearch";
import { ONLINE_WINDOW_MS, usePresence } from "./usePresence";
import { useReport } from "./useReport";

export function useCommunityViewModel() {
  const { user } = useAuthSession();
  const { defaultLocation } = useAccountProfile();
  const uid = user?.uid ?? null;
  const name = user ? nameOf(user) : "Observer";
  const author = useMemo<AuthorSnapshot | null>(
    () =>
      uid
        ? {
            uid,
            name,
            initials: initialsOf(name),
            rank: `${RANK.title} · Lv ${RANK.level}`,
          }
        : null,
    [uid, name],
  );
  const following = useFollowing(uid);
  const feed = useFeed(uid, defaultLocation, following);
  const presence = usePresence(author);
  const autoPublish = useAutoPublish(author, feed.prepend);
  const compose = useCompose(author, defaultLocation, feed.prepend);
  const comments = useComments(author, feed.changeCommentCount);
  const report = useReport(uid);
  const search = useObserverSearch(uid, following);
  const { now } = presence;

  const observerView = (observer: (typeof presence.observers)[number]): ObserverView => ({
    ...observer,
    online: now - observer.lastActiveAt < ONLINE_WINDOW_MS,
    own: observer.uid === uid,
    following: following.ids.includes(observer.uid),
  });
  const posts: PostView[] = feed.posts.map((post) => ({
    ...post,
    ago: formatAgo(post.createdAt, now),
    own: post.author.uid === uid,
    starred: uid !== null && post.starredBy.includes(uid),
    seen: uid !== null && post.seenBy.includes(uid),
    following: following.ids.includes(post.author.uid),
  }));
  const commentItems: CommentView[] = comments.items.map((comment) => ({
    ...comment,
    ago: formatAgo(comment.createdAt, now),
    own: comment.author.uid === uid,
  }));
  const logSighting = useCallback(() => router.push("/sightings/new"), []);
  const refresh = () => {
    feed.refresh();
    void following.reload();
  };

  return {
    identity: { initials: author?.initials ?? "?", signedIn: uid !== null },
    feed: {
      ...feed,
      posts,
      refresh,
    },
    presence: { ...presence, observers: presence.observers.map(observerView) },
    compose,
    autoPublish,
    comments: { ...comments, items: commentItems },
    report,
    search: {
      ...search,
      results: search.results.map(observerView),
    },
    navigation: { logSighting },
    localMode: communityBackend === "local",
  };
}
