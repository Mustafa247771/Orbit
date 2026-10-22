import type { SatelliteDetails } from "@/core/orbit/details";

export type SatelliteDetailsView = {
  id: number;
  name: string;
  noradId: string;
  altitude: string;
  speed: string;
  latitude: string;
  longitude: string;
  period: string;
};

const grouped = (value: number) => Math.round(value).toLocaleString("en-US");
const degrees = (value: number, positive: string, negative: string) =>
  `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`;

export function formatDetails(details: SatelliteDetails): SatelliteDetailsView {
  return {
    id: details.noradId,
    name: details.name,
    noradId: String(details.noradId),
    altitude: `${grouped(details.altitudeKm)} km`,
    speed: `${grouped(details.speedKmh)} km/h`,
    latitude: degrees(details.latitude, "N", "S"),
    longitude: degrees(details.longitude, "E", "W"),
    period: `${details.periodMinutes.toFixed(1)} min`,
  };
}
