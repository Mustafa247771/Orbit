import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { addDays, easternToday, msUntilNextEasternDay, validateApodDate } from "../model/apodDates";
import { apodErrorMessage } from "../model/apodParsing";
import { apodRepository, type ApodDayResult } from "../model/ApodCacheRepository";

// `key` is the request the state belongs to; a different current key means loading.
type DayState = { key: string | null; result: ApodDayResult | null; error: string | null };

/** The selected APOD day: today in US Eastern, loading, fallback and navigation. */
export function useApodDay() {
  const [today, setToday] = useState(() => easternToday(new Date()));
  const [selected, setSelected] = useState(today);
  const [state, setState] = useState<DayState>({ key: null, result: null, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const todayRef = useRef(today);
  const token = useRef(0);

  // The picture changes at midnight US Eastern; follow it when the user is on "today".
  const syncToday = useCallback(() => {
    const next = easternToday(new Date());
    const previous = todayRef.current;
    if (next === previous) return;
    todayRef.current = next;
    setToday(next);
    setSelected((current) => (current === previous ? next : current));
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncToday();
      const subscription = AppState.addEventListener("change", (appState) => {
        if (appState === "active") syncToday();
      });
      return () => subscription.remove();
    }, [syncToday]),
  );

  // Keeps "today" right while the screen stays open across US Eastern midnight.
  useEffect(() => {
    const timer = setTimeout(() => {
      syncToday();
      setTick((value) => value + 1); // Schedules the next midnight, even if nothing changed.
    }, msUntilNextEasternDay(new Date()) + 1000);
    return () => clearTimeout(timer);
  }, [syncToday, today, tick]);

  // Only the newest request may update the screen.
  const load = useCallback((date: string, now: string, quiet: boolean, force: boolean) => {
    const mine = ++token.current;
    const key = `${date}|${now}`;
    apodRepository.loadDay(date, now, force).then(
      (result) => {
        if (mine !== token.current) return;
        setRefreshing(false);
        setState({ key, result, error: null });
      },
      (caught: unknown) => {
        if (mine !== token.current) return;
        setRefreshing(false);
        const error = apodErrorMessage(caught);
        setState((current) =>
          quiet && current.result
            ? { key, result: current.result, error }
            : { key, result: null, error },
        );
      },
    );
  }, []);

  const stop = useCallback(() => {
    token.current++;
  }, []);

  useEffect(() => {
    load(selected, today, false, false);
    return stop;
  }, [load, stop, selected, today]);

  const goToDate = useCallback(
    (date: string) => {
      const message = validateApodDate(date, today);
      setDateError(message);
      if (!message) setSelected(date.trim());
    },
    [today],
  );

  const retry = useCallback(() => {
    setState((current) => ({ ...current, key: null }));
    load(selected, today, false, true);
  }, [load, selected, today]);
  const refresh = useCallback(() => {
    setRefreshing(true);
    load(selected, today, true, true);
  }, [load, selected, today]);

  const { result } = state;
  const loading = state.key !== `${selected}|${today}`;
  // When today's picture is missing the day before is shown; step back from that one.
  const anchor = result?.fallbackFrom ? result.entry.date : selected;

  return {
    today,
    selected,
    loading,
    refreshing,
    entry: loading ? null : (result?.entry ?? null),
    source: loading || !result ? null : result.source === "cache" ? ("offline" as const) : ("live" as const),
    emptyError: loading || result ? null : state.error,
    notice: loading || !result ? null : (state.error ?? result.error),
    fallbackNotice:
      !loading && result?.fallbackFrom
        ? `Today's picture isn't out yet — showing ${result.entry.date}`
        : null,
    dateError,
    goToDate,
    goPrevious: () => goToDate(addDays(anchor, -1)),
    goNext: () => goToDate(addDays(selected, 1)),
    retry,
    refresh,
  };
}
