import { satelliteDetails } from "@/core/orbit/details";
import { earthRotation, eciAxesToScene, eciToScene } from "@/core/orbit/frames";
import {
  orbitPathEci,
  positionEci,
  stateEci,
  toTrackedSatellite,
} from "@/core/orbit/propagate";
import { sunDirection } from "@/core/orbit/sun";
import type { Vec3 } from "@/core/orbit/types";
import type { SatelliteFamily } from "@/core/satellites/family";
import { SAMPLE_TLES } from "@/core/satellites/sampleTles";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDetails, type SatelliteDetailsView } from "./formatDetails";

export type { SatelliteDetailsView, SatelliteFamily, Vec3 };
export type SatelliteSummary = {
  id: number;
  name: string;
  family: SatelliteFamily;
};

const TIME_SCALE = 1;
const PATH_REFRESH_MS = 10 * 60 * 1000;
const PATH_STEPS = 180;
const DETAILS_REFRESH_MS = 1000;

export function useEarthViewModel() {
  const [startedAt] = useState(() => Date.now());

  const now = useCallback(
    () => new Date(startedAt + (Date.now() - startedAt) * TIME_SCALE),
    [startedAt],
  );

  const tracked = useMemo(() => SAMPLE_TLES.map(toTrackedSatellite), []);

  const buildPaths = useCallback(() => {
    const start = now();
    const paths: Record<number, Vec3[]> = {};
    for (const satellite of tracked) {
      paths[satellite.id] = orbitPathEci(satellite, start, PATH_STEPS).map(
        eciToScene,
      );
    }
    return paths;
  }, [now, tracked]);

  const [orbitPaths, setOrbitPaths] = useState(buildPaths);

  useEffect(() => {
    const timer = setInterval(
      () => setOrbitPaths(buildPaths()),
      PATH_REFRESH_MS,
    );

    return () => clearInterval(timer);
  }, [buildPaths]);

  const satellites = useMemo<SatelliteSummary[]>(
    () => tracked.map(({ id, name, family }) => ({ id, name, family })),
    [tracked],
  );

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(
    () => satellites.find((satellite) => satellite.id === selectedId) ?? null,
    [satellites, selectedId],
  );
  const [details, setDetails] = useState<SatelliteDetailsView | null>(null);

  const detailsFor = useCallback(
    (id: number) => {
      const satellite = tracked.find((candidate) => candidate.id === id);
      const raw = satellite ? satelliteDetails(satellite, now()) : null;
      return raw ? formatDetails(raw) : null;
    },
    [now, tracked],
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

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);
  const getSunDirection = useCallback(() => sunDirection(now()), [now]);
  const getEarthRotation = useCallback(() => earthRotation(now()), [now]);
  const getSatellitePosition = useCallback(
    (id: number) => {
      const satellite = tracked.find((candidate) => candidate.id === id);
      const position = satellite ? positionEci(satellite.satrec, now()) : null;
      return position ? eciToScene(position) : null;
    },
    [now, tracked],
  );
  const getSatelliteVelocity = useCallback(
    (id: number) => {
      const satellite = tracked.find((candidate) => candidate.id === id);
      const state = satellite ? stateEci(satellite.satrec, now()) : null;
      return state ? eciAxesToScene(state.velocity) : null;
    },
    [now, tracked],
  );

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
    getDate: now,
  };
}
