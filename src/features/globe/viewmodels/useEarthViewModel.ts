import { satelliteDetails } from "@/core/orbit/details";
import { earthRotation } from "@/core/orbit/frames";
import { sunDirection } from "@/core/orbit/sun";
import type { Vec3 } from "@/core/orbit/types";
import {
  OBJECT_LABELS,
  type CatalogueObject,
} from "@/core/satellites/catalogueTypes";
import {
  matchesMode,
  type CatalogueMode,
} from "@/core/satellites/catalogueFilters";
import {
  satelliteFamily,
  type SatelliteFamily,
} from "@/core/satellites/family";
import { OrbitCatalogue } from "@/core/satellites/OrbitCatalogue";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDevicePreferences } from "@/core/preferences";
import { formatDetails, type SatelliteDetailsView } from "./formatDetails";
import { useCatalogue } from "./useCatalogue";
import { useGlobeMenu } from "./useGlobeMenu";
import { useObjectSearch } from "./useObjectSearch";
import { useOrbitPaths } from "./useOrbitPaths";
import { useTracking } from "./useTracking";

export type { SatelliteDetailsView, SatelliteFamily, Vec3 };

export type SatelliteSummary = ReturnType<typeof summary>;

const DETAILS_REFRESH_MS = 1000;
const now = () => new Date();

function summary({ id, name, kind }: CatalogueObject) {
  return { id, name, kind, family: satelliteFamily(name) };
}

export function useEarthViewModel() {
  const {
    data,
    refreshing,
    retry: retrySatellites,
    status: satelliteStatus,
  } = useCatalogue();
  const {
    preferences,
    trackedIds,
    loaded: preferencesLoaded,
    error: preferenceError,
    notice: trackingNotice,
    saving: savingTracking,
    retry: retryTracking,
    changeMode: saveMode,
    toggleTracked: saveTracked,
  } = useTracking();
  const mode = preferences?.mode ?? null;
  const menu = useGlobeMenu();
  const { units } = useDevicePreferences();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const objects = useMemo(
    () => data.catalogue?.objects ?? [],
    [data.catalogue],
  );
  const catalogue = useMemo(() => new OrbitCatalogue(objects), [objects]);
  const brightIds = useMemo(
    () => new Set(data.catalogue?.brightIds ?? []),
    [data.catalogue],
  );
  const visibleObjects = useMemo(
    () =>
      objects.filter((item) =>
        matchesMode(item.id, mode, trackedIds, brightIds),
      ),
    [objects, mode, trackedIds, brightIds],
  );

  const visibleSummaries = useMemo(
    () => visibleObjects.map(summary),
    [visibleObjects],
  );
  const selected = useMemo(() => {
    const item = selectedId === null ? null : catalogue.objects.get(selectedId);

    return item ? summary(item) : null;
  }, [selectedId, catalogue]);

  const orbitPaths = useOrbitPaths(catalogue, visibleObjects, mode, selectedId);

  const satellites = useMemo(() => {
    if (selected && !visibleSummaries.some((item) => item.id === selected.id))
      return [...visibleSummaries, selected];

    return visibleSummaries;
  }, [visibleSummaries, selected]);

  const [details, setDetails] = useState<SatelliteDetailsView | null>(null);

  const detailsFor = useCallback(
    (id: number) => {
      const satellite = catalogue.get(id);
      const raw = satellite ? satelliteDetails(satellite, now()) : null;

      return raw ? formatDetails(raw, units) : null;
    },
    [catalogue, units],
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

  const getSunDirection = useCallback(() => sunDirection(now()), []);
  const getEarthRotation = useCallback(() => earthRotation(now()), []);

  const getSatelliteState = useCallback(
    (id: number, date: Date) => catalogue.sceneState(id, date),
    [catalogue],
  );

  const changeMode = useCallback(
    async (mode: CatalogueMode) => {
      if (!(await saveMode(mode))) return;
      if (
        selectedId !== null &&
        !matchesMode(selectedId, mode, trackedIds, brightIds)
      )
        clearSelection();
    },
    [saveMode, selectedId, trackedIds, brightIds, clearSelection],
  );

  const toggleTracked = useCallback(
    async (id: number) => {
      if (!(await saveTracked(id))) return;
      if (trackedIds.has(id) && mode === "tracked" && selectedId === id)
        clearSelection();
    },
    [saveTracked, trackedIds, mode, selectedId, clearSelection],
  );

  const search = useObjectSearch(objects, mode, trackedIds, selectSatellite);
  const missingTracked = [...trackedIds].filter(
    (id) => !catalogue.objects.has(id),
  ).length;

  return {
    satellites,
    orbitPaths,
    getSunDirection,
    getEarthRotation,
    orbitCatalogue: catalogue,
    selectedId,
    selected,
    selectSatellite,
    clearSelection,
    details,
    ...menu,
    getDate: now,
    satelliteStatus,
    satelliteError: data.error ?? data.catalogue?.warning ?? null,
    refreshing,
    retrySatellites,
    retryTracking,
    getSatelliteState,
    catalogueMode: mode,
    preferencesLoaded,
    preferenceError,
    trackingNotice,
    savingTracking,
    changeMode,
    toggleTracked,
    trackedIds,
    ...search,
    missingTracked,
    selectedTracked: selectedId !== null && trackedIds.has(selectedId),
    selectedObjectLabel:
      selected && selected.kind !== "payload"
        ? OBJECT_LABELS[selected.kind]
        : undefined,
  };
}
