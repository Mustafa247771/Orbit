import type { CatalogueMode } from "@/core/satellites/catalogueFilters";
import {
  trackingRepository,
  type TrackingPreferences,
} from "@/core/satellites/TrackingRepository";
import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

const SYNC_NOTICE =
  "Saved on this phone — will sync to your account when you're online.";

export function useTracking() {
  const { user } = useAuthSession();
  const uid = user?.uid ?? null;
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<TrackingPreferences | null>(
    null,
  );
  const loaded = preferences !== null && loadedUid === uid;
  const preferencesRef = useRef<TrackingPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const retryRef = useRef<(() => void) | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (loaded) return;
      let active = true;
      let running = false;

      const load = async () => {
        if (!active || running) return;
        running = true;

        try {
          const stored = await trackingRepository.read(uid);
          if (active) {
            preferencesRef.current = stored.preferences;
            setPreferences(stored.preferences);
            setLoadedUid(uid);
            setNotice(stored.unsynced ? SYNC_NOTICE : null);
            setError(null);
          }
        } catch {
          if (active)
            setError(
              "Your saved tracking settings could not be read. Try again.",
            );
        } finally {
          running = false;
        }
      };

      retryRef.current = () => void load();
      void load();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void load();
      });
      return () => {
        active = false;
        retryRef.current = null;
        subscription.remove();
      };
    }, [loaded, uid]),
  );

  const retry = useCallback(() => retryRef.current?.(), []);
  const trackedIds = useMemo(
    () => new Set(preferences?.trackedIds),
    [preferences?.trackedIds],
  );

  const save = useCallback(async (next: TrackingPreferences) => {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);

    try {
      const written = await trackingRepository.write(uid, next);
      preferencesRef.current = next;
      setPreferences(next);
      setNotice(written.unsynced ? SYNC_NOTICE : null);
      setError(null);
      return true;
    } catch {
      setError("Your tracking settings could not be saved. Please try again.");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [uid]);

  const changeMode = useCallback(
    async (mode: CatalogueMode) => {
      const current = preferencesRef.current;
      return current ? save({ ...current, mode }) : false;
    },
    [save],
  );

  const toggleTracked = useCallback(
    async (id: number) => {
      const current = preferencesRef.current;
      if (!current) return false;

      const ids = new Set(current.trackedIds);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);

      return save({ ...current, trackedIds: [...ids] });
    },
    [save],
  );

  return {
    preferences,
    trackedIds,
    loaded,
    error,
    notice,
    saving,
    retry,
    changeMode,
    toggleTracked,
  };
}
