import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import type { ApodEntry } from "../model/Apod";
import { isFavorite, toggleFavorite, type ApodFavorite } from "../model/apodFavorites";
import { apodFavoritesRepository } from "../model/ApodFavoritesRepository";

const SAVE_FAILED = "Couldn't save your change. Please try again.";
const LOAD_FAILED = "Your saved discoveries could not be loaded.";
const OFFLINE_NOTICE = "Saved on this phone — will sync to your account when you're online.";
const NOT_READY = "Your saved discoveries are still loading. Try again in a moment.";

// loadFailed: the file could not be read, so changes are blocked rather than overwrite it.
type Saved = { uid: string; items: ApodFavorite[]; loadFailed: boolean; offline: boolean };
type Problem = { uid: string; message: string };

// Runs loads and saves one after another, so the last change is the one left on disk.
function enqueue(queue: { current: Promise<void> }, task: () => Promise<void>) {
  queue.current = queue.current.then(task).catch(() => undefined);
}

/** Saved pictures of the signed-in user, with optimistic changes and rollback. */
export function useApodFavorites() {
  const uid = useAuthSession().user?.uid ?? null;
  const [saved, setSaved] = useState<Saved | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [seenUid, setSeenUid] = useState(uid);
  const latest = useRef<Saved | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const show = useCallback((next: Saved) => {
    latest.current = next;
    setSaved(next);
  }, []);

  // A new sign-in (even as the same account) reloads before anything is shown or saved.
  if (seenUid !== uid) {
    setSeenUid(uid);
    setSaved(null);
    setProblem(null);
  }

  useEffect(() => {
    latest.current = null;
    if (uid === null) return;
    let cancelled = false;
    enqueue(queue, async () => {
      let next: Saved;
      try {
        const result = await apodFavoritesRepository.read(uid);
        next = { uid, items: result.items, loadFailed: false, offline: result.fromPhone };
      } catch {
        next = { uid, items: [], loadFailed: true, offline: false };
      }
      if (!cancelled) show(next);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, show]);

  // Shows the change at once and saves it; if saving fails, only this day is put back.
  const change = useCallback(
    (date: string, update: (items: ApodFavorite[]) => ApodFavorite[]) => {
      if (uid === null) return;
      const current = latest.current;
      if (!current || current.uid !== uid) {
        setProblem({ uid, message: NOT_READY });
        return;
      }
      if (current.loadFailed) {
        setProblem({ uid, message: LOAD_FAILED });
        return;
      }
      const before = current.items.find((item) => item.date === date);
      const snapshot = { uid: current.uid, items: update(current.items) };
      show({ ...current, items: snapshot.items });
      setProblem(null);

      // Each save carries its own snapshot, so a user switch never drops or
      // misattributes a write.
      enqueue(queue, async () => {
        try {
          const result = await apodFavoritesRepository.write(snapshot.uid, snapshot.items);
          const now = latest.current;
          if (now && now.uid === snapshot.uid && now.offline === result.synced) {
            show({ ...now, offline: !result.synced });
          }
        } catch {
          setProblem({ uid: snapshot.uid, message: SAVE_FAILED });
          const again = latest.current;
          if (!again || again.uid !== snapshot.uid) return;
          const rest = again.items.filter((item) => item.date !== date);
          const items = before ? [...rest, before] : rest;
          show({ ...again, items: items.sort((a, b) => b.savedAt - a.savedAt) });
        }
      });
    },
    [show, uid],
  );

  const toggle = useCallback(
    (entry: ApodEntry) =>
      change(entry.date, (items) => toggleFavorite(items, entry, Date.now())),
    [change],
  );

  const remove = useCallback(
    (date: string) => change(date, (items) => items.filter((item) => item.date !== date)),
    [change],
  );

  const mine = saved?.uid === uid ? saved : null;
  const items = mine?.items ?? [];
  const message = problem?.uid === uid ? problem.message : null;

  return {
    items,
    savedCount: items.length,
    loading: uid !== null && mine === null,
    error: message ?? (mine?.loadFailed ? LOAD_FAILED : null),
    notice: mine?.offline ? OFFLINE_NOTICE : null,
    isSaved: (date: string) => isFavorite(items, date),
    toggle,
    remove,
  };
}
