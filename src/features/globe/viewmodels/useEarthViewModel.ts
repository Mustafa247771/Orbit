import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import { satelliteDetails } from "@/core/orbit/details";
import { earthRotation, eciAxesToScene, eciToScene } from "@/core/orbit/frames";
import { orbitPathEci, positionEci, stateEci } from "@/core/orbit/propagate";
import { sunDirection } from "@/core/orbit/sun";
import type { Vec3 } from "@/core/orbit/types";
import {
  catalogueRepository,
  OBJECT_LABELS,
  type CatalogueObject,
  type CatalogueSnapshot,
  type ObjectKind,
} from "@/core/satellites/CatalogueRepository";
import {
  satelliteFamily,
  type SatelliteFamily,
} from "@/core/satellites/family";
import { OrbitCatalogue } from "@/core/satellites/OrbitCatalogue";
import {
  matchesMode,
  searchCatalogue,
  trackingRepository,
  type CatalogueMode,
  type TrackingPreferences,
} from "@/core/satellites/TrackingRepository";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { formatDetails, type SatelliteDetailsView } from "./formatDetails";

export type { SatelliteDetailsView, SatelliteFamily, Vec3 };

export type SatelliteSummary = {
  id: number;
  name: string;
  family: SatelliteFamily;
  kind: ObjectKind;
};

const TIME_SCALE = 1;
const PATH_REFRESH_MS = 10 * 60 * 1000;
const PATH_STEPS = 180;
const DETAILS_REFRESH_MS = 1000;
const CACHE_CHECK_MS = 60_000;

function downloadedAgo(timestamp: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));

  if (minutes === 0) return "downloaded just now";
  if (minutes < 60) return "downloaded " + minutes + " min ago";

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return "downloaded " + hours + " h ago";

  return "downloaded " + Math.floor(hours / 24) + " d ago";
}

function summary(item: CatalogueObject): SatelliteSummary {
  return {
    id: item.id,
    name: item.name,
    kind: item.kind,
    family: satelliteFamily(item.name),
  };
}

export function useEarthViewModel() {
  const { canAccessAccount, user } = useAuthSession();
  const [startedAt] = useState(() => Date.now());

  const now = useCallback(
    () => new Date(startedAt + (Date.now() - startedAt) * TIME_SCALE),
    [startedAt],
  );

  const [data, setData] = useState<CatalogueSnapshot>({
    catalogue: null,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(true);
  const [cacheClock, setCacheClock] = useState(() => Date.now());
  const retryRef = useRef<(() => void) | null>(null);

  const [preferences, setPreferences] = useState<TrackingPreferences>({
    mode: null,
    trackedIds: [],
  });
  const preferencesRef = useRef<TrackingPreferences | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [savingTracking, setSavingTracking] = useState(false);

  const savingRef = useRef(false);
  const mounted = useRef(true);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

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
          if (!preferencesRef.current) {
            try {
              const stored = await trackingRepository.read();

              if (active) {
                preferencesRef.current = stored;
                setPreferences(stored);
                setPreferencesLoaded(true);
                setPreferenceError(null);
              }
            } catch {
              if (active)
                setPreferenceError(
                  "Your saved tracking settings could not be read. Try again.",
                );
            }
          }

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

      retryRef.current = () => {
        void load(true);
      };

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

  const retrySatellites = useCallback(() => retryRef.current?.(), []);

  const objects = useMemo(
    () => data.catalogue?.objects ?? [],
    [data.catalogue],
  );

  const orbitCatalogue = useMemo(() => new OrbitCatalogue(objects), [objects]);

  const trackedIds = useMemo(
    () => new Set(preferences.trackedIds),
    [preferences.trackedIds],
  );

  const brightIds = useMemo(
    () => new Set(data.catalogue?.brightIds ?? []),
    [data.catalogue],
  );

  const visibleObjects = useMemo(() => {
    if (preferences.mode === "all") return objects;

    return objects.filter((item) =>
      matchesMode(item.id, preferences.mode, trackedIds, brightIds),
    );
  }, [objects, preferences.mode, trackedIds, brightIds]);

  const visibleSummaries = useMemo(
    () => visibleObjects.map(summary),
    [visibleObjects],
  );

  const selected = useMemo(() => {
    const item =
      selectedId === null ? null : orbitCatalogue.objects.get(selectedId);

    return item ? summary(item) : null;
  }, [selectedId, orbitCatalogue]);

  const buildPaths = useCallback(() => {
    const start = now();
    const paths: Record<number, Vec3[]> = {};
    const ids = new Set<number>();

    if (preferences.mode === "bright" || preferences.mode === "tracked") {
      visibleObjects.forEach((item) => ids.add(item.id));
    }

    if (selectedId !== null) ids.add(selectedId);

    for (const id of ids) {
      const satellite = orbitCatalogue.get(id);
      if (!satellite) continue;

      paths[id] = orbitPathEci(satellite, start, PATH_STEPS).map(eciToScene);
    }

    return paths;
  }, [now, orbitCatalogue, selectedId, visibleObjects, preferences.mode]);

  const [orbitPaths, setOrbitPaths] = useState(buildPaths);

  useEffect(() => {
    const rebuild = setTimeout(() => setOrbitPaths(buildPaths()), 0);

    const timer = setInterval(
      () => setOrbitPaths(buildPaths()),
      PATH_REFRESH_MS,
    );

    return () => {
      clearTimeout(rebuild);
      clearInterval(timer);
    };
  }, [buildPaths]);

  const satellites = useMemo(() => {
    if (selected && !visibleSummaries.some((item) => item.id === selected.id))
      return [...visibleSummaries, selected];

    return visibleSummaries;
  }, [visibleSummaries, selected]);

  const [details, setDetails] = useState<SatelliteDetailsView | null>(null);

  const detailsFor = useCallback(
    (id: number) => {
      const satellite = orbitCatalogue.get(id);
      const raw = satellite ? satelliteDetails(satellite, now()) : null;

      return raw ? formatDetails(raw) : null;
    },
    [now, orbitCatalogue],
  );

  const selectSatellite = useCallback(
    (id: number) => {
      setSelectedId(id);
      setDetails(detailsFor(id));
    },
    [detailsFor],
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setDetails(null);
  }, []);

  useEffect(() => {
    if (selectedId === null) return;

    const timer = setInterval(
      () => setDetails(detailsFor(selectedId)),
      DETAILS_REFRESH_MS,
    );

    return () => clearInterval(timer);
  }, [selectedId, detailsFor]);

  const [menu, setMenu] = useState<{ owner: typeof user; open: boolean }>({
    owner: null,
    open: false,
  });
  const menuOpen = canAccessAccount && menu.owner === user && menu.open;
  const toggleMenu = useCallback(() => {
    if (!canAccessAccount || !user) return;
    setMenu((current) => ({
      owner: user,
      open: current.owner === user ? !current.open : true,
    }));
  }, [user, canAccessAccount]);
  const openLogin = useCallback(() => router.push("./login"), []);
  const getSunDirection = useCallback(() => sunDirection(now()), [now]);
  const getEarthRotation = useCallback(() => earthRotation(now()), [now]);

  const getSatellitePosition = useCallback(
    (id: number) => {
      const satellite = orbitCatalogue.get(id);
      const position = satellite ? positionEci(satellite.satrec, now()) : null;

      return position ? eciToScene(position) : null;
    },
    [now, orbitCatalogue],
  );

  const getSatelliteVelocity = useCallback(
    (id: number) => {
      const satellite = orbitCatalogue.get(id);
      const state = satellite ? stateEci(satellite.satrec, now()) : null;

      return state ? eciAxesToScene(state.velocity) : null;
    },
    [now, orbitCatalogue],
  );

  const getSatelliteState = useCallback(
    (id: number, date: Date) => orbitCatalogue.sceneState(id, date),
    [orbitCatalogue],
  );

  const savePreferences = useCallback(async (next: TrackingPreferences) => {
    if (savingRef.current) return false;

    savingRef.current = true;
    setSavingTracking(true);

    try {
      await trackingRepository.write(next);
      preferencesRef.current = next;

      if (mounted.current) {
        setPreferences(next);
        setPreferenceError(null);
      }

      return true;
    } catch {
      if (mounted.current)
        setPreferenceError(
          "Your tracking settings could not be saved. Please try again.",
        );

      return false;
    } finally {
      savingRef.current = false;

      if (mounted.current) setSavingTracking(false);
    }
  }, []);

  const changeMode = useCallback(
    async (mode: CatalogueMode) => {
      const current = preferencesRef.current;

      if (
        !current ||
        !(await savePreferences({
          ...current,
          mode,
        }))
      )
        return;

      if (
        selectedId !== null &&
        !matchesMode(selectedId, mode, new Set(current.trackedIds), brightIds)
      )
        clearSelection();
    },
    [savePreferences, selectedId, brightIds, clearSelection],
  );

  const toggleTracked = useCallback(
    async (id: number) => {
      const current = preferencesRef.current;
      if (!current) return;

      const ids = new Set(current.trackedIds);
      const removing = ids.has(id);

      if (removing) ids.delete(id);
      else ids.add(id);

      if (
        await savePreferences({
          ...current,
          trackedIds: [...ids],
        })
      ) {
        if (removing && current.mode === "tracked" && selectedId === id)
          clearSelection();
      }
    },
    [savePreferences, selectedId, clearSelection],
  );

  const selectFromSearch = useCallback(
    (id: number) => {
      selectSatellite(id);
      setSearchOpen(false);
    },
    [selectSatellite],
  );

  const searchResults = useMemo(() => {
    const text = query.trim().toLowerCase();

    const matches = text
      ? searchCatalogue(objects, query)
      : preferences.mode === "tracked"
        ? objects.filter((item) => trackedIds.has(item.id)).slice(0, 50)
        : [];

    const available = matches.map(({ id, name, kind }) => ({
      id,
      name,
      kind,
      available: true,
    }));

    const unavailable = preferences.trackedIds
      .filter(
        (id) =>
          !orbitCatalogue.objects.has(id) &&
          (text ? String(id).includes(text) : preferences.mode === "tracked"),
      )
      .map((id) => ({
        id,
        name: "NORAD " + id,
        kind: "unknown" as const,
        available: false,
      }));

    return [...available, ...unavailable].slice(0, 50);
  }, [
    objects,
    query,
    preferences.mode,
    preferences.trackedIds,
    trackedIds,
    orbitCatalogue,
  ]);

  const missingTracked = preferences.trackedIds.filter(
    (id) => !orbitCatalogue.objects.has(id),
  ).length;

  const satelliteStatus = refreshing
    ? data.catalogue
      ? "Updating orbital data…"
      : "Loading orbital catalogue…"
    : data.catalogue
      ? "CelesTrak · oldest collection " +
        downloadedAgo(data.catalogue.updatedAt, cacheClock)
      : "Catalogue unavailable";

  return {
    satellites,
    orbitPaths,
    getSunDirection,
    getEarthRotation,
    getSatellitePosition,
    getSatelliteVelocity,
    selectedId,
    selected,
    selectSatellite,
    clearSelection,
    details,
    menuOpen,
    toggleMenu,
    canAccessMenu: canAccessAccount,
    openLogin,
    getDate: now,
    satelliteStatus,
    satelliteError: data.error ?? data.catalogue?.warning ?? null,
    refreshing,
    retrySatellites,
    getSatelliteState,
    catalogueMode: preferences.mode,
    preferencesLoaded,
    preferenceError,
    savingTracking,
    changeMode,
    toggleTracked,
    trackedIds,
    query,
    setQuery,
    searchOpen,
    setSearchOpen,
    searchResults,
    selectFromSearch,
    missingTracked,
    selectedTracked: selectedId !== null && trackedIds.has(selectedId),
    selectedObjectLabel:
      selected && selected.kind !== "payload"
        ? OBJECT_LABELS[selected.kind]
        : undefined,
  };
}
