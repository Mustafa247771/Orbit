import { useCallback, useEffect, useMemo, useState } from "react";

import type { Launch } from "@/features/launches/model/Launch";
import { launchService } from "@/features/launches/model/LaunchService";

export function launchCountdown(net: string, now: number) {
  const remaining = Math.max(0, new Date(net).getTime() - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function useLaunchCalendarViewModel() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"live" | "cache">("live");
  const [now, setNow] = useState(0);

  const load = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await launchService.getUpcoming(forceRefresh);
      setLaunches(result.launches);
      setSource(result.source);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Launch data is unavailable.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      load();
      setNow(Date.now());
    }, 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(loadTimer);
      clearInterval(timer);
    };
  }, [load]);

  return useMemo(
    () => ({
      error,
      featuredLaunch: launches[0] ?? null,
      launches,
      loading,
      now,
      refresh: () => load(true),
      refreshing,
      source,
    }),
    [error, launches, loading, load, now, refreshing, source],
  );
}
