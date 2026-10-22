import {
    degreesLat,
    degreesLong,
    eciToGeodetic,
    gstime,
    propagate,
} from "satellite.js";

import type { TrackedSatellite } from "./propagate";

export type SatelliteDetails = {
  noradId: number;
  name: string;
  latitude: number;
  longitude: number;
  altitudeKm: number;
  speedKmh: number;
  periodMinutes: number;
};

export function satelliteDetails(
  satellite: TrackedSatellite,
  date: Date,
): SatelliteDetails | null {
  const result = propagate(satellite.satrec, date);
  if (
    !result ||
    typeof result.position !== "object" ||
    typeof result.velocity !== "object"
  ) {
    return null;
  }

  const ground = eciToGeodetic(result.position, gstime(date));
  const { x, y, z } = result.velocity;
  return {
    noradId: satellite.id,
    name: satellite.name,
    latitude: degreesLat(ground.latitude),
    longitude: degreesLong(ground.longitude),
    altitudeKm: ground.height,
    speedKmh: Math.hypot(x, y, z) * 3600,
    periodMinutes: satellite.periodMinutes,
  };
}
