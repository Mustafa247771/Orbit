import { useCallback, useEffect, useMemo, useState } from "react";
import { Share } from "react-native";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<readonly SpacePicture[]>([]);
  const [fullView, setFullView] = useState(false);

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

  const picture =
    pictures.find((item) => item.id === selectedId) ?? pictures[0] ?? null;
  const isPictureOfTheDay = picture !== null && picture === pictures[0];
  const isSaved =
    picture !== null && saved.some((item) => item.id === picture.id);

  const archive = useMemo(
    () => pictures.filter((item) => item !== picture).slice(0, ARCHIVE_SIZE),
    [pictures, picture],
  );

  const dateLabel = useMemo(
    () =>
      today.toLocaleDateString([], {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [today],
  );

  const save = useCallback((item: SpacePicture) => {
    setSaved((current) =>
      current.some((entry) => entry.id === item.id)
        ? current
        : [item, ...current],
    );
  }, []);

  const toggleSave = useCallback((item: SpacePicture) => {
    setSaved((current) =>
      current.some((entry) => entry.id === item.id)
        ? current.filter((entry) => entry.id !== item.id)
        : [item, ...current],
    );
  }, []);

  const share = useCallback((item: SpacePicture) => {
    Share.share({ message: `${item.title} · ${item.imageUrl}` });
  }, []);

  return {
    loading,
    error,
    retry,
    topic,
    dateLabel,
    picture,
    isPictureOfTheDay,
    isSaved,
    archive,
    select: setSelectedId,
    saved,
    save,
    toggleSave,
    share,
    fullView,
    openFullView: () => setFullView(true),
    closeFullView: () => setFullView(false),
  };
}
