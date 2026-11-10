import { useSyncExternalStore } from "react";
import { useReducedMotion } from "react-native-reanimated";

export type DevicePreferences = {
  units: "metric" | "imperial";
  haptics: boolean;
  reduceMotion: boolean;
};

let current: DevicePreferences = {
  units: "metric",
  haptics: true,
  reduceMotion: false,
};
const listeners = new Set<() => void>();

export function setDevicePreferences(next: DevicePreferences): void {
  if (
    next.units === current.units &&
    next.haptics === current.haptics &&
    next.reduceMotion === current.reduceMotion
  ) {
    return;
  }
  current = { units: next.units, haptics: next.haptics, reduceMotion: next.reduceMotion };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDevicePreferences(): DevicePreferences {
  return current;
}

export function useDevicePreferences(): DevicePreferences {
  return useSyncExternalStore(subscribe, getDevicePreferences, getDevicePreferences);
}

export function hapticsEnabled(): boolean {
  return current.haptics;
}

/** True when the system or the in-app setting asks for less motion. */
export function useReduceMotion(): boolean {
  const system = useReducedMotion();
  return useDevicePreferences().reduceMotion || system;
}
