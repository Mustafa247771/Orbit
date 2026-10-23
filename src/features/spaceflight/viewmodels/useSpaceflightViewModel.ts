import { timeAgo } from "@/core/time/timeAgo";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Article } from "../model/Article";
import { newsService } from "../model/NewsService";

// The API has no topics, so chips filter the loaded stories by keywords.
export const CATEGORIES = [
  { id: "all", label: "All", pattern: null },
  { id: "launches", label: "Launches", pattern: /launch|rocket|booster/i },
  {
    id: "station",
    label: "Station",
    pattern: /\biss\b|space station|spacewalk/i,
  },
  { id: "moon", label: "Moon", pattern: /moon|lunar|artemis/i },
  { id: "mars", label: "Mars", pattern: /mars|martian/i },
  {
    id: "science",
    label: "Science",
    pattern: /telescope|galaxy|nebula|exoplanet|asteroid/i,
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type ArticleView = Article & { meta: string };

const TICKER_MS = 4000;
const TICKER_STORIES = 5;

export function useSpaceflightViewModel() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryId>("all");
  const [saved, setSaved] = useState<ReadonlySet<number>>(() => new Set());
  const [tick, setTick] = useState(0);

  const load = useCallback(
    () =>
      newsService
        .getLatest()
        .then(
          (latest) => {
            setArticles(latest);
            setFetchedAt(Date.now());
            setError(null);
          },
          (caught: unknown) => {
            setError(
              caught instanceof Error ? caught.message : "News is unavailable.",
            );
          },
        )
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        }),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), TICKER_MS);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  const views = useMemo<ArticleView[]>(
    () =>
      articles.map((article) => ({
        ...article,
        meta: `${article.site} · ${timeAgo(article.publishedAt, fetchedAt)}`,
      })),
    [articles, fetchedAt],
  );

  const filtered = useMemo(() => {
    const pattern = CATEGORIES.find((item) => item.id === category)?.pattern;
    return pattern
      ? views.filter((article) =>
          pattern.test(`${article.title} ${article.summary}`),
        )
      : views;
  }, [views, category]);

  const featured = filtered.find((article) => article.featured) ?? filtered[0];
  const latest = filtered.filter((article) => article !== featured);
  const headline = views.length
    ? views[tick % Math.min(views.length, TICKER_STORIES)].title
    : null;

  const toggleSaved = useCallback((id: number) => {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const open = useCallback((article: Article) => {
    WebBrowser.openBrowserAsync(article.url);
  }, []);

  return {
    loading,
    refreshing,
    error,
    refresh,
    retry,
    category,
    setCategory,
    featured: featured ?? null,
    latest,
    headline,
    tick,
    saved,
    toggleSaved,
    open,
  };
}
