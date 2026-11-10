import {
  CLOUD_RANGE,
  DEFAULT_ACCOUNT_SETTINGS,
  DEFAULT_DEVICE_SETTINGS,
  ELEVATION_RANGE,
  LEAD_TIME_OPTIONS,
  MAX_LOCATIONS,
  type AccountProfile,
  type DeviceSettings,
  type NotificationSettings,
  type NumberRange,
  type SavedLocation,
} from "./Profile.ts";
import { ensureOneDefault } from "./savedLocations.ts";

const NAME_MIN = 2;
export const NAME_MAX = 40;
export const PLACE_NAME_MAX = 40;
export const SEARCH_QUERY_MIN = 2;
export const SEARCH_QUERY_MAX = 200;

export type LocationErrors = Partial<
  Record<"name" | "latitude" | "longitude", string>
>;

export function validateDisplayName(name: string): string | null {
  const length = name.trim().length;

  if (length === 0) return "Enter the name you want to be known by.";
  if (length < NAME_MIN) return `Use at least ${NAME_MIN} characters.`;
  if (length > NAME_MAX) return `Keep your name to ${NAME_MAX} characters.`;
  return null;
}

export function validateSearchQuery(query: string): string | null {
  const length = query.trim().length;

  if (length < SEARCH_QUERY_MIN) {
    return `Enter at least ${SEARCH_QUERY_MIN} characters to find a place.`;
  }
  if (length > SEARCH_QUERY_MAX) {
    return `Keep your search to ${SEARCH_QUERY_MAX} characters.`;
  }
  return null;
}

export function validateLocationInput(
  input: { name: string; latitude: number; longitude: number },
  existing: SavedLocation[],
  editingId?: string,
): LocationErrors {
  const errors: LocationErrors = {};
  const name = input.name.trim();

  if (name.length === 0) {
    errors.name = "Give this place a name.";
  } else if (name.length > PLACE_NAME_MAX) {
    errors.name = `Keep the name to ${PLACE_NAME_MAX} characters.`;
  } else if (
    existing.some(
      (place) =>
        place.id !== editingId &&
        place.name.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = "You already saved a place with this name.";
  } else if (editingId === undefined && existing.length >= MAX_LOCATIONS) {
    errors.name = `You can save up to ${MAX_LOCATIONS} places. Remove one first.`;
  }

  if (
    !Number.isFinite(input.latitude) ||
    input.latitude < -90 ||
    input.latitude > 90
  ) {
    errors.latitude = "Latitude is a number from -90 to 90.";
  }
  if (
    !Number.isFinite(input.longitude) ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    errors.longitude = "Longitude is a number from -180 to 180.";
  }

  return errors;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const flag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

// Rounds to the nearest step and keeps the number inside the range.
export function snapToRange(
  value: unknown,
  range: NumberRange,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const steps = Math.round((value - range.min) / range.step);
  const snapped = range.min + steps * range.step;

  return Math.min(range.max, Math.max(range.min, snapped));
}

export function parseDeviceSettings(raw: unknown): DeviceSettings {
  const source = isRecord(raw) ? raw : {};

  return {
    units:
      source.units === "metric" || source.units === "imperial"
        ? source.units
        : DEFAULT_DEVICE_SETTINGS.units,
    haptics: flag(source.haptics, DEFAULT_DEVICE_SETTINGS.haptics),
    reduceMotion: flag(
      source.reduceMotion,
      DEFAULT_DEVICE_SETTINGS.reduceMotion,
    ),
  };
}

function parseNotifications(raw: unknown): NotificationSettings {
  const source = isRecord(raw) ? raw : {};
  const defaults = DEFAULT_ACCOUNT_SETTINGS.notifications;

  return {
    passAlerts: flag(source.passAlerts, defaults.passAlerts),
    launchReminders: flag(source.launchReminders, defaults.launchReminders),
    dailyPicture: flag(source.dailyPicture, defaults.dailyPicture),
  };
}

function parseLocation(raw: unknown): SavedLocation | null {
  if (!isRecord(raw)) return null;
  const { id, name, latitude, longitude, isDefault } = raw;
  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof name !== "string") return null;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  const place = {
    id,
    name: name.trim(),
    latitude,
    longitude,
    isDefault: isDefault === true,
  };
  const errors = validateLocationInput(place, []);

  return Object.keys(errors).length === 0 ? place : null;
}

function parseLocations(raw: unknown): SavedLocation[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const places: SavedLocation[] = [];

  for (const item of raw) {
    const place = parseLocation(item);
    if (!place || seen.has(place.id)) continue;
    seen.add(place.id);
    places.push(place);
  }

  const kept = places.slice(0, MAX_LOCATIONS);
  const firstDefault = kept.find((place) => place.isDefault)?.id;

  return ensureOneDefault(
    kept.map((place) => ({ ...place, isDefault: place.id === firstDefault })),
  );
}

export function parseAccountProfile(raw: unknown): AccountProfile {
  const source = isRecord(raw) ? raw : {};
  const saved = isRecord(source.settings) ? source.settings : {};
  const defaults = DEFAULT_ACCOUNT_SETTINGS;
  const leadMinutes = saved.leadMinutes;

  return {
    settings: {
      observationMode:
        saved.observationMode === "naked-eye" ||
        saved.observationMode === "telescope"
          ? saved.observationMode
          : defaults.observationMode,
      leadMinutes:
        typeof leadMinutes === "number" && Number.isFinite(leadMinutes)
          ? LEAD_TIME_OPTIONS.reduce((best, option) =>
              leadMinutes > (best + option) / 2 ? option : best,
            )
          : defaults.leadMinutes,
      minElevation: snapToRange(
        saved.minElevation,
        ELEVATION_RANGE,
        defaults.minElevation,
      ),
      maxCloud: snapToRange(saved.maxCloud, CLOUD_RANGE, defaults.maxCloud),
      notifications: parseNotifications(saved.notifications),
      sightingVisibility:
        saved.sightingVisibility === "private" ||
        saved.sightingVisibility === "community"
          ? saved.sightingVisibility
          : defaults.sightingVisibility,
    },
    locations: parseLocations(source.locations),
    photoUri:
      typeof source.photoUri === "string" && source.photoUri.length > 0
        ? source.photoUri
        : null,
  };
}
