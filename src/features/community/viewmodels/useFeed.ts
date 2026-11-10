import { useCallback, useMemo, useState } from "react";

import type { SavedLocation } from "@/features/profile/model/Profile";
import type { CommunityPost, FeedScope } from "../model/communityTypes";
import { feedEmptyMessage, matchesFeedScope, mergeFeedPosts } from "./feedPolicy";
import { useFeedActions } from "./useFeedActions";
import { useFeedPages } from "./useFeedPages";

type Following = {
  ids: string[];
  ready: boolean;
  loadError: string | null;
  toggleError: string | null;
  toggle: (uid: string) => Promise<void>;
};

export function useFeed(uid: string | null, location: SavedLocation | null, following: Following) {
  const [scope, setScope] = useState<FeedScope>("global");
  const followingKey = JSON.stringify(following.ids);
  const followingIds = useMemo(() => JSON.parse(followingKey) as string[], [followingKey]);
  const latitude = scope === "nearby" ? location?.latitude : undefined;
  const longitude = scope === "nearby" ? location?.longitude : undefined;
  const { state, setPosts, setError, refresh, loadMore } = useFeedPages({
    uid,
    scope,
    latitude,
    longitude,
    followingIds,
    ready: scope !== "following" || following.ready,
    followingError: scope === "following" ? following.loadError : null,
  });
  const matches = useCallback(
    (post: CommunityPost) =>
      matchesFeedScope(
        post,
        scope,
        latitude !== undefined && longitude !== undefined ? { latitude, longitude } : null,
        followingIds,
      ),
    [scope, latitude, longitude, followingIds],
  );
  const posts = useMemo(() => state.posts.filter(matches), [state.posts, matches]);
  const prepend = useCallback(
    (post: CommunityPost) => {
      if (matches(post)) setPosts((current) => mergeFeedPosts([post], current));
    },
    [matches, setPosts],
  );
  const changeCommentCount = useCallback(
    (id: string, delta: number) => {
      setPosts((current) =>
        current.map((post) =>
          post.id === id ? { ...post, commentCount: Math.max(0, post.commentCount + delta) } : post,
        ),
      );
    },
    [setPosts],
  );
  const actions = useFeedActions(uid, `${uid}:${scope}`, state.posts, setPosts, setError);

  return {
    ...state,
    ...actions,
    posts,
    scope,
    setScope,
    followAuthor: following.toggle,
    followingError: following.toggleError,
    emptyMessage: feedEmptyMessage(uid, scope, location !== null, followingIds.length),
    hasMore: state.cursor !== null && posts.length > 0,
    refresh,
    loadMore,
    prepend,
    changeCommentCount,
  };
}
