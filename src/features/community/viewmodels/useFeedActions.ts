import { useRef } from "react";
import { Share } from "react-native";

import { communityErrorMessage } from "../model/communityErrors";
import { communityRepository } from "../model/communityRepository";
import type { CommunityPost } from "../model/communityTypes";
import { useResetOnUid } from "./useResetOnUid";

export function useFeedActions(
  uid: string | null,
  key: string,
  posts: CommunityPost[],
  setPosts: (change: (posts: CommunityPost[]) => CommunityPost[]) => void,
  setError: (error: string | null) => void,
) {
  const pending = useRef(new Set<string>());
  const generationRef = useResetOnUid(key, () => {
    pending.current = new Set();
  });
  const toggle = async (id: string, field: "starredBy" | "seenBy") => {
    const post = posts.find((item) => item.id === id);
    const mutation = `${id}:${field}`;
    if (!uid || !post || pending.current.has(mutation)) return;
    const active = pending.current;
    active.add(mutation);
    const token = generationRef.current;
    const before = post[field];
    const on = !before.includes(uid);
    setError(null);
    setPosts((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: on ? [...before, uid] : before.filter((value) => value !== uid),
            }
          : item,
      ),
    );
    try {
      if (field === "starredBy") await communityRepository.toggleStar(id, uid, on);
      else await communityRepository.toggleSeen(id, uid, on);
    } catch (failure) {
      if (token === generationRef.current) {
        setPosts((current) =>
          current.map((item) => (item.id === id ? { ...item, [field]: before } : item)),
        );
        setError(communityErrorMessage(failure));
      }
    } finally {
      active.delete(mutation);
    }
  };
  const deletePost = async (id: string) => {
    if (!uid || posts.find((post) => post.id === id)?.author.uid !== uid || pending.current.has(id))
      return;
    const active = pending.current;
    active.add(id);
    const token = generationRef.current;
    setError(null);
    try {
      await communityRepository.deletePost(id);
      if (token === generationRef.current)
        setPosts((current) => current.filter((post) => post.id !== id));
    } catch (failure) {
      if (token === generationRef.current) setError(communityErrorMessage(failure));
    } finally {
      active.delete(id);
    }
  };
  const share = async (post: CommunityPost) => {
    const token = generationRef.current;
    try {
      await Share.share({
        message: `${post.author.name} spotted ${post.objectName}${post.city ? ` from ${post.city}` : ""} on Orbit.\n${post.caption}${post.photoUrl ? `\n${post.photoUrl}` : ""}`,
      });
    } catch (failure) {
      if (token === generationRef.current) setError(communityErrorMessage(failure));
    }
  };
  return {
    deletePost: (id: string) => {
      void deletePost(id);
    },
    share,
    toggleStar: (id: string) => {
      void toggle(id, "starredBy");
    },
    toggleSeen: (id: string) => {
      void toggle(id, "seenBy");
    },
  };
}
