/** Satellite topocentric bearings and optical conditions, kept outside Views. */
import { Body, Equator, GeoVector, Horizon, Observer, RotateVector, Rotation_EQJ_EQD } from "astronomy-engine";
import { ecfToLookAngles, eciToEcf, gstime } from "satellite.js";
import { stateEci, type TrackedSatellite } from "./propagate";

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const EARTH_RADIUS_KM = 6378.137;

export type ObserverLocation = { latitude: number; longitude: number; altitude?: number };
export type SatelliteBearing = {
  azimuth: number;
  elevation: number;
  rangeKm: number;
  sunlit: boolean;
};

export function sunAltitude(location: ObserverLocation, time: Date): number {
  const observer = new Observer(location.latitude, location.longitude, location.altitude ?? 0);
  const equatorial = Equator(Body.Sun, time, observer, true, true);
  return Horizon(time, observer, equatorial.ra, equatorial.dec, "normal").altitude;
}

/** Approximate cylindrical Earth shadow; penumbra and atmospheric refraction not modelled. */
function isSunlit(position: { x: number; y: number; z: number }, time: Date): boolean {
  const sunJ2000 = GeoVector(Body.Sun, time, true);
  const sun = RotateVector(Rotation_EQJ_EQD(time), sunJ2000);
  const length = Math.hypot(sun.x, sun.y, sun.z);
  const dx = sun.x / length;
  const dy = sun.y / length;
  const dz = sun.z / length;
  const along = position.x * dx + position.y * dy + position.z * dz;
  if (along >= 0) return true;
  const radialSq =
    position.x ** 2 + position.y ** 2 + position.z ** 2 - along ** 2;
  return radialSq > EARTH_RADIUS_KM ** 2;
}

export function satelliteBearing(
  satellite: TrackedSatellite,
  location: ObserverLocation,
  time: Date,
): SatelliteBearing | null {
  const state = stateEci(satellite.satrec, time);
  if (!state) return null;
  const look = ecfToLookAngles(
    {
      latitude: location.latitude * DEG,
      longitude: location.longitude * DEG,
      height: (location.altitude ?? 0) / 1000,
    },
    eciToEcf(state.position, gstime(time)),
  );
  if (![look.azimuth, look.elevation, look.rangeSat].every(Number.isFinite)) return null;
  return {
    azimuth: ((look.azimuth * RAD) % 360 + 360) % 360,
    elevation: look.elevation * RAD,
    rangeKm: look.rangeSat,
    sunlit: isSunlit(state.position, time),
  };
}

export function cardinalDirection(angle: number): string {
  const names = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return names[Math.round((((angle % 360) + 360) % 360) / 45) % 8];
}
