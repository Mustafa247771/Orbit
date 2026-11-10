import type { DevicePreferences } from "./devicePreferences";

const KM_TO_MI = 0.621371;

export function formatDistance(km: number, units: DevicePreferences["units"]): string {
  return units === "imperial"
    ? `${Math.round(km * KM_TO_MI).toLocaleString("en-US")} mi`
    : `${Math.round(km).toLocaleString("en-US")} km`;
}

export function formatSpeed(kmh: number, units: DevicePreferences["units"]): string {
  return units === "imperial"
    ? `${Math.round(kmh * KM_TO_MI).toLocaleString("en-US")} mph`
    : `${Math.round(kmh).toLocaleString("en-US")} km/h`;
}
