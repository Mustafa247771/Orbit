import { useCallback, useRef, useState } from "react";

import { validateComment } from "../model/commentValidation";
import { communityErrorMessage } from "../model/communityErrors";
import { communityRepository } from "../model/communityRepository";
import type { AuthorSnapshot, PostComment } from "../model/communityTypes";
import { useResetOnUid } from "./useResetOnUid";

export function useComments(
  author: AuthorSnapshot | null,
  onCountChange: (id: string, delta: number) => void,
) {
  const [postId, setPostId] = useState<string | null>(null);
  const [items, setItems] = useState<PostComment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const guard = useRef(false);
  const deleting = useRef(new Set<string>());
  const uid = author?.uid;
  const generationRef = useResetOnUid(uid, () => {
    setPostId(null);
    setItems([]);
    setText("");
    setError(null);
    setInputError(null);
    setLoading(false);
    setBusy(false);
    guard.current = false;
    deleting.current = new Set();
  });

  const close = useCallback(() => {
    if (guard.current || deleting.current.size) return;
    generationRef.current++;
    setPostId(null);
    setText("");
    setError(null);
    setInputError(null);
  }, [generationRef]);

  const open = useCallback(
    (id: string) => {
      if (guard.current || deleting.current.size) return;
      const token = ++generationRef.current;
      setPostId(id);
      setItems([]);
      setText("");
      setError(null);
      setInputError(null);
      setLoading(true);
      void communityRepository
        .listComments(id)
        .then((comments) => {
          if (token === generationRef.current) setItems(comments);
        })
        .catch((failure: unknown) => {
          if (token === generationRef.current) setError(communityErrorMessage(failure));
        })
        .finally(() => {
          if (token === generationRef.current) setLoading(false);
        });
    },
    [generationRef],
  );

  const add = async () => {
    if (guard.current || !postId || loading) return;
    const problem = validateComment(text);
    setInputError(problem);
    setError(null);
    if (problem) return;
    if (!author) {
      setError("Sign in to add a comment.");
      return;
    }
    guard.current = true;
    setBusy(true);
    const token = generationRef.current;
    try {
      const comment = await communityRepository.addComment(postId, author, text.trim());
      if (token !== generationRef.current) return;
      setItems((current) => [...current, comment]);
      setText("");
      onCountChange(postId, 1);
    } catch (failure) {
      if (token === generationRef.current) setError(communityErrorMessage(failure));
    } finally {
      if (token === generationRef.current) {
        guard.current = false;
        setBusy(false);
      }
    }
  };

  const deleteComment = async (id: string) => {
    if (
      !postId ||
      !uid ||
      items.find((item) => item.id === id)?.author.uid !== uid ||
      deleting.current.has(id)
    )
      return;
    const active = deleting.current;
    active.add(id);
    setError(null);
    const token = generationRef.current;
    try {
      await communityRepository.deleteComment(postId, id);
      if (token !== generationRef.current) return;
      setItems((current) => current.filter((item) => item.id !== id));
      onCountChange(postId, -1);
    } catch (failure) {
      if (token === generationRef.current) setError(communityErrorMessage(failure));
    } finally {
      active.delete(id);
    }
  };

  return {
    postId,
    items,
    text,
    loading,
    busy,
    error,
    inputError,
    open,
    close,
    setText: (value: string) => {
      setText(value);
      setInputError(null);
    },
    retry: () => {
      if (postId) open(postId);
    },
    add: () => {
      void add();
    },
    deleteComment: (id: string) => {
      void deleteComment(id);
    },
  };
}
