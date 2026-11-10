import { catalogueRepository } from "@/core/satellites/CatalogueRepository";
import type { CatalogueSnapshot } from "@/core/satellites/catalogueTypes";
import { timeAgo } from "@/core/time/timeAgo";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";

const CACHE_CHECK_MS = 60_000;

export function useCatalogue() {
  const [data, setData] = useState<CatalogueSnapshot>({
    catalogue: null,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(true);
  const [cacheClock, setCacheClock] = useState(() => Date.now());
  const retryRef = useRef<(() => void) | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let running = false;

      const load = async (retry = false) => {
        if (
          !active ||
          running ||
          (AppState.currentState && AppState.currentState !== "active")
        )
          return;

        running = true;

        try {
          const saved = await catalogueRepository.readCached();
          if (active) setData(saved);

          if (!retry && !catalogueRepository.needsRefresh()) return;
          if (active) setRefreshing(true);

          const updated = await catalogueRepository.refresh(retry);
          if (active) setData(updated);
        } catch {
          if (active)
            setData((current) => ({
              ...current,
              error: "Satellite data is unavailable. Please try again.",
            }));
        } finally {
          running = false;
          if (active) {
            setRefreshing(false);
            setCacheClock(Date.now());
          }
        }
      };

      retryRef.current = () => void load(true);
      void load();

      const timer = setInterval(() => {
        if (AppState.currentState === "active") {
          setCacheClock(Date.now());
          void load();
        }
      }, CACHE_CHECK_MS);

      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          setCacheClock(Date.now());
          void load();
        }
      });

      return () => {
        active = false;
        retryRef.current = null;
        clearInterval(timer);
        subscription.remove();
      };
    }, []),
  );

  const retry = useCallback(() => retryRef.current?.(), []);
  const status = refreshing
    ? data.catalogue
      ? "Updating orbital data…"
      : "Loading orbital catalogue…"
    : data.catalogue
      ? `CelesTrak · oldest collection downloaded ${timeAgo(data.catalogue.updatedAt, cacheClock)}`
      : "Catalogue unavailable";

  return { data, refreshing, retry, status };
}
