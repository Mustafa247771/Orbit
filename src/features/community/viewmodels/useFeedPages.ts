import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { communityErrorMessage } from "../model/communityErrors";
import { communityRepository } from "../model/communityRepository";
import type { CommunityPost, FeedScope } from "../model/communityTypes";
import { readFeedCache, writeFeedCache } from "../model/feedCache";
import { neighbourCells } from "../model/geoCells";
import { isFeedOfflineError, mergeFeedPosts } from "./feedPolicy";
import { useResetOnUid } from "./useResetOnUid";

type FeedState = {
  posts: CommunityPost[];
  cursor: string | null;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  offline: boolean;
  error: string | null;
  updatedAt: number;
  location: string;
  cacheReady: boolean;
};
const initial: FeedState = {
  posts: [],
  cursor: null,
  loading: true,
  refreshing: false,
  loadingMore: false,
  offline: false,
  error: null,
  updatedAt: 0,
  location: "",
  cacheReady: false,
};
type FeedQuery = {
  uid: string | null;
  scope: FeedScope;
  latitude?: number;
  longitude?: number;
  followingIds: string[];
  ready: boolean;
  followingError: string | null;
};

export function useFeedPages({
  uid,
  scope,
  latitude,
  longitude,
  followingIds,
  ready,
  followingError,
}: FeedQuery) {
  const key = `${uid}:${scope}`;
  const [states, setStates] = useState<Record<string, FeedState>>({});
  const state = states[key] ?? initial;
  const update = useCallback(
    (change: Partial<FeedState> | ((state: FeedState) => Partial<FeedState>)) => {
      setStates((current) => {
        const before = current[key] ?? initial;
        return {
          ...current,
          [key]: { ...before, ...(typeof change === "function" ? change(before) : change) },
        };
      });
    },
    [key],
  );
  const setPosts = useCallback(
    (change: (posts: CommunityPost[]) => CommunityPost[]) => {
      update((current) => ({ posts: change(current.posts), cacheReady: true }));
    },
    [update],
  );
  const setError = useCallback((error: string | null) => update({ error }), [update]);
  const pagingRef = useRef(false);
  const generationRef = useResetOnUid(key, () => {
    pagingRef.current = false;
  });
  const locationKey = `${latitude}:${longitude}`;

  const request = useCallback(
    async (more = false, pull = false) => {
      if (!ready || followingError || (more && pagingRef.current)) return;
      const token = more ? generationRef.current : ++generationRef.current;
      const requestedPosts = state.posts;
      pagingRef.current = true;
      update({
        error: null,
        loading: !more && !pull && !state.posts.length,
        refreshing: pull,
        loadingMore: more,
      });
      if (
        !uid ||
        (scope === "nearby" && latitude === undefined) ||
        (scope === "following" && !followingIds.length)
      ) {
        pagingRef.current = false;
        update({ loading: false, refreshing: false, loadingMore: false });
        return;
      }
      try {
        const page = await communityRepository.listPosts(scope, {
          uid,
          cursor: more ? state.cursor : null,
          followingUids: followingIds,
          cells:
            latitude !== undefined && longitude !== undefined
              ? neighbourCells(latitude, longitude)
              : [],
        });
        if (token !== generationRef.current) return;
        update((current) => ({
          // Preserve local edits made while this page was loading.
          posts: mergeFeedPosts(
            more ? current.posts : current.posts.filter((post) => !requestedPosts.includes(post)),
            page.posts,
          ),
          cursor: page.cursor,
          offline: false,
          error: null,
          updatedAt: Date.now(),
          location: locationKey,
          cacheReady: true,
        }));
      } catch (failure) {
        if (token !== generationRef.current) return;
        const error = communityErrorMessage(failure);
        if (more || !isFeedOfflineError(failure)) {
          update(more ? { error } : { error, offline: false });
          return;
        }
        const saved = await readFeedCache(uid, scope).catch(() => []);
        if (token === generationRef.current)
          update((current) => ({
            posts: current.posts.length ? current.posts : saved,
            offline: true,
            error,
            cacheReady: true,
          }));
      } finally {
        if (token === generationRef.current) {
          pagingRef.current = false;
          update({ loading: false, refreshing: false, loadingMore: false });
        }
      }
    },
    [
      ready,
      followingError,
      generationRef,
      update,
      state.posts,
      state.cursor,
      uid,
      scope,
      latitude,
      longitude,
      followingIds,
      locationKey,
    ],
  );

  const latest = useRef({ request, state });
  useLayoutEffect(() => {
    latest.current = { request, state };
  });
  useFocusEffect(
    useCallback(() => {
      if (!ready || followingError) return;
      const current = latest.current;
      if (Date.now() - current.state.updatedAt >= 60_000 || current.state.location !== locationKey)
        void current.request();
      return () => {
        generationRef.current++;
        pagingRef.current = false;
        update({ loading: false, refreshing: false, loadingMore: false });
      };
    }, [locationKey, ready, followingError, generationRef, update]),
  );

  useEffect(() => {
    if (uid && state.cacheReady)
      void writeFeedCache(uid, scope, state.posts).catch(() => undefined);
  }, [uid, scope, state.posts, state.cacheReady]);

  return {
    state: { ...state, loading: state.loading || !ready, error: followingError ?? state.error },
    setPosts,
    setError,
    refresh: () => {
      void latest.current.request(false, true);
    },
    loadMore: () => {
      if (state.cursor && !state.loading && !state.refreshing) void latest.current.request(true);
    },
  };
}
