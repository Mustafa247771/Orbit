import { useCallback, useEffect, useMemo, useState } from "react";

import { nasaImageService } from "../model/NasaImageService";
import type { SpacePicture } from "../model/SpacePicture";

const DAILY_TOPICS = [
  "nebula",
  "galaxy",
  "aurora",
  "saturn",
  "jupiter",
  "star cluster",
  "earth from space",
];
const ARCHIVE_SIZE = 8;
const DAY_MS = 86_400_000;
// The strip shows six days with today fourth, so two upcoming days sit after it.
const STRIP_DAYS = 6;
const TODAY_INDEX = 3;

export type StripDay = {
  key: string;
  day: number;
  today: boolean;
  future: boolean;
};

function dayOfYear(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - startOfYear.getTime()) / DAY_MS);
}

export function useApodViewModel() {
  const [today] = useState(() => new Date());
  const topic = DAILY_TOPICS[dayOfYear(today) % DAILY_TOPICS.length];

  const [pictures, setPictures] = useState<SpacePicture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      nasaImageService
        .search(topic)
        .then(
          (results) => {
            setPictures(results);
            setError(null);
          },
          (caught: unknown) => {
            setError(
              caught instanceof Error
                ? caught.message
                : "NASA pictures are unavailable.",
            );
          },
        )
        .finally(() => setLoading(false)),
    [topic],
  );

  useEffect(() => {
    load();
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  const archive = useMemo(
    () => pictures.slice(1, ARCHIVE_SIZE + 1),
    [pictures],
  );

  const days = useMemo<StripDay[]>(
    () =>
      Array.from({ length: STRIP_DAYS }, (_, index) => {
        const date = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + index - TODAY_INDEX,
        );
        return {
          key: date.toDateString(),
          day: date.getDate(),
          today: index === TODAY_INDEX,
          future: index > TODAY_INDEX,
        };
      }),
    [today],
  );

  return {
    loading,
    error,
    retry,
    picture: pictures[0] ?? null,
    archive,
    days,
    month: today.toLocaleDateString([], { month: "long" }),
    year: String(today.getFullYear()),
  };
}
