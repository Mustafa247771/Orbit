import { useCallback, useEffect, useMemo, useState } from "react";

import type { Launch } from "@/features/launches/model/Launch";
import { launchService } from "@/features/launches/model/LaunchService";

export type LaunchView = Launch & {
  month: string;
  day: string;
  time: string;
  target: string;
  secondsLeft: number;
  tMinus: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

function toView(launch: Launch, now: number): LaunchView {
  const date = new Date(launch.net);
  const secondsLeft = Math.max(0, Math.floor((date.getTime() - now) / 1000));
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);

  return {
    ...launch,
    month: date.toLocaleDateString([], { month: "short" }),
    day: String(date.getDate()),
    time: date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    target: date.toLocaleString([], {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
    secondsLeft,
    tMinus: `T− ${days}d ${pad(hours)}h ${pad(minutes)}m`,
  };
}

export function useLaunchesViewModel() {
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

  const views = useMemo(
    () => launches.map((launch) => toView(launch, now)),
    [launches, now],
  );

  return useMemo(
    () => ({
      error,
      featured: views[0] ?? null,
      upcoming: views.slice(1),
      live: source === "live",
      loading,
      refresh: () => load(true),
      refreshing,
    }),
    [error, views, source, loading, load, refreshing],
  );
}
