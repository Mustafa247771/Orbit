import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ApodEntry } from "../model/Apod";
import { weekWindow } from "../model/apodDates";
import { apodRepository } from "../model/ApodCacheRepository";

/** The week around the selected day and its pictures for the archive cards. */
export function useApodWeek(selected: string, today: string, shownDate: string | null) {
  const [days, setDays] = useState(() => weekWindow(selected, today));
  const [entries, setEntries] = useState<ApodEntry[]>([]);
  const token = useRef(0);

  // The window only moves when the selected day leaves it, so browsing inside it
  // reuses the same days and the cache instead of asking NASA again.
  if (!days.includes(selected)) {
    const next = weekWindow(selected, today);
    if (next.join() !== days.join()) setDays(next);
  }

  // The selected day is loaded by the day view model; ask only for the others.
  const toLoad = useMemo(() => days.filter((day) => day !== selected), [days, selected]);

  // Quiet on purpose: without the archive the rest of the screen still works.
  const reload = useCallback(
    (force = false) => {
      const mine = ++token.current;
      apodRepository.loadWeek(toLoad, today, force).then(
        (week) => {
          if (mine === token.current) setEntries(week.entries);
        },
        () => {
          if (mine === token.current) setEntries([]);
        },
      );
    },
    [toLoad, today],
  );

  const stop = useCallback(() => {
    token.current++;
  }, []);

  useEffect(() => {
    reload();
    return stop;
  }, [reload, stop]);

  const archive = useMemo(
    () =>
      entries
        .filter((entry) => entry.date !== selected && entry.date !== shownDate)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries, selected, shownDate],
  );

  return { days, archive, reload };
}
