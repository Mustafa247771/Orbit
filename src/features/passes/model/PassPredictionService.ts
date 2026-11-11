import { cardinalDirection, satelliteBearing, sunAltitude, type ObserverLocation } from "@/core/orbit/observer";
import type { TrackedSatellite } from "@/core/orbit/propagate";
import { cloudsAt, type CloudForecast } from "./WeatherService";

export type PredictedPass = {
  id: string;
  startAt: number;
  endAt: number;
  peakAt: number;
  peakElevation: number;
  direction: string;
  durationMinutes: number;
  cloudPercent: number | null;
  sunlit: boolean;
  opticallyVisible: boolean;
  reason: string;
};

/** Samples SGP4 positions every minute for seven days. Times are approximate. */
export function predictPasses(
  satellite: TrackedSatellite,
  location: ObserverLocation,
  forecast: CloudForecast | null,
  options: { now?: number; minElevation?: number; maxCloud?: number } = {},
): PredictedPass[] {
  const now = options.now ?? Date.now();
  const until = now + 7 * 24 * 3600000;
  const minElevation = Math.max(10, options.minElevation ?? 10);
  const maxCloud = options.maxCloud ?? 30;
  const step = 60000;
  const results: PredictedPass[] = [];
  let current: { startAt: number; peakAt: number; peak: number; startAz: number; endAz: number; sunlit: boolean } | null = null;

  for (let at = now; at <= until + step; at += step) {
    const bearing = at <= until ? satelliteBearing(satellite, location, new Date(at)) : null;
    if (bearing && bearing.elevation >= minElevation) {
      if (!current) current = { startAt: at, peakAt: at, peak: bearing.elevation, startAz: bearing.azimuth, endAz: bearing.azimuth, sunlit: bearing.sunlit };
      current.endAz = bearing.azimuth;
      if (bearing.elevation > current.peak) {
        current.peak = bearing.elevation;
        current.peakAt = at;
        current.sunlit = bearing.sunlit;
      }
    } else if (current) {
      const cloud = cloudsAt(forecast, current.peakAt);
      const dark = sunAltitude(location, new Date(current.peakAt)) <= -6;
      const optical = dark && current.sunlit && cloud !== null && cloud <= maxCloud;
      const reason = [!dark ? "Sky too bright" : null, !current.sunlit ? "Satellite in Earth's shadow" : null,
        cloud === null ? "Cloud forecast unavailable" : cloud > maxCloud ? "Too cloudy" : null].filter(Boolean).join(" · ") || "Predicted viewing conditions are favorable";
      results.push({
        id: `${satellite.id}-${current.startAt}`, startAt: current.startAt, endAt: at,
        peakAt: current.peakAt, peakElevation: current.peak,
        direction: `${cardinalDirection(current.startAz)} → ${cardinalDirection(current.endAz)}`,
        durationMinutes: Math.max(1, Math.round((at - current.startAt) / step)),
        cloudPercent: cloud, sunlit: current.sunlit, opticallyVisible: optical, reason,
      });
      current = null;
    }
  }
  return results;
}
