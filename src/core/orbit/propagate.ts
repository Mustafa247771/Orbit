import { json2satrec, propagate, type SatRec } from "satellite.js";

import {
  satelliteFamily,
  type SatelliteFamily,
} from "@/core/satellites/family";
import type { SatelliteElements } from "@/core/satellites/SatelliteData";
import type { Vec3 } from "./types";

export type TrackedSatellite = {
  id: number;
  name: string;
  family: SatelliteFamily;
  satrec: SatRec;
  periodMinutes: number;
};

export type StateEci = { position: Vec3; velocity: Vec3 };

export function fromSatelliteElements(
  elements: SatelliteElements,
): TrackedSatellite {
  return {
    id: Number(elements.NORAD_CAT_ID),
    name: elements.OBJECT_NAME,
    family: satelliteFamily(elements.OBJECT_NAME),
    satrec: json2satrec(elements),
    periodMinutes: 1440 / Number(elements.MEAN_MOTION),
  };
}

export function stateEci(satrec: SatRec, date: Date): StateEci | null {
  const result = propagate(satrec, date);
  if (
    !result ||
    typeof result.position !== "object" ||
    typeof result.velocity !== "object"
  ) {
    return null;
  }
  const { position: p, velocity: v } = result;
  return {
    position: { x: p.x, y: p.y, z: p.z },
    velocity: { x: v.x, y: v.y, z: v.z },
  };
}

export function positionEci(satrec: SatRec, date: Date): Vec3 | null {
  return stateEci(satrec, date)?.position ?? null;
}

export function orbitPathEci(
  satellite: TrackedSatellite,
  start: Date,
  steps: number,
): Vec3[] {
  const stepMs = (satellite.periodMinutes * 60_000) / steps;
  const points: Vec3[] = [];
  for (let i = 0; i < steps; i++) {
    const point = positionEci(
      satellite.satrec,
      new Date(start.getTime() + i * stepMs),
    );
    if (point) points.push(point);
  }
  return points;
}
