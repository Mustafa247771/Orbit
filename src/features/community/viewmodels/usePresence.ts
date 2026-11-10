import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { communityErrorMessage } from "../model/communityErrors";
import { communityRepository } from "../model/communityRepository";
import type { AuthorSnapshot, Observer } from "../model/communityTypes";
import { useResetOnUid } from "./useResetOnUid";

// Focus updates are intermittent on mobile; allow 15 minutes before showing offline.
export const ONLINE_WINDOW_MS = 15 * 60_000;

export function usePresence(author: AuthorSnapshot | null) {
  const [observers, setObservers] = useState<Observer[]>([]);
  const [activeToday, setActiveToday] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const generationRef = useResetOnUid(author?.uid, () => {
    setObservers([]);
    setActiveToday(0);
    setError(null);
    setLoading(true);
  });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const token = generationRef.current;
      const active = () => !cancelled && token === generationRef.current;
      setNow(Date.now());
      setError(null);
      setLoading(true);
      const timer = setInterval(() => setNow(Date.now()), 30_000);
      void (async () => {
        if (!author) {
          setLoading(false);
          return;
        }
        try {
          await communityRepository.touchPresence({
            ...author,
            lastActiveAt: Date.now(),
          });
        } catch (failure) {
          if (active()) setError(communityErrorMessage(failure));
        }
        if (!active()) return;
        try {
          const activity = await communityRepository.recentObservers(4);
          if (active()) {
            setObservers(activity.observers);
            setActiveToday(activity.activeToday);
          }
        } catch (failure) {
          if (active()) setError(communityErrorMessage(failure));
        } finally {
          if (active()) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }, [author, generationRef]),
  );

  return {
    observers,
    activeToday,
    now,
    error,
    subtitle:
      loading && !observers.length && !activeToday
        ? "Finding observers under the shared sky…"
        : error
          ? "Observer activity is unavailable right now"
          : `${activeToday} observers active today`,
    moreObservers: Math.max(0, activeToday - observers.length),
  };
}
