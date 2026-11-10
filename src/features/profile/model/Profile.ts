import type { SightingVisibility } from "../../sightings/model/Sighting";

export type ObservationMode = "naked-eye" | "telescope";
export type Units = "metric" | "imperial";

export type NumberRange = { min: number; max: number; step: number };

export const LEAD_TIME_OPTIONS = [5, 10, 15, 30, 60] as const;
export const ELEVATION_RANGE: NumberRange = { min: 0, max: 45, step: 5 };
export const CLOUD_RANGE: NumberRange = { min: 0, max: 100, step: 10 };
export const MAX_LOCATIONS = 10;

/** Settings that belong to this phone, so guests have them too. */
export type DeviceSettings = {
  units: Units;
  haptics: boolean;
  reduceMotion: boolean;
};

export type NotificationSettings = {
  passAlerts: boolean;
  launchReminders: boolean;
  dailyPicture: boolean;
};

/** Settings that belong to a signed-in account. */
export type AccountSettings = {
  observationMode: ObservationMode;
  leadMinutes: number;
  minElevation: number;
  maxCloud: number;
  notifications: NotificationSettings;
  sightingVisibility: SightingVisibility;
};

export type SavedLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
};

export type AccountProfile = {
  settings: AccountSettings;
  locations: SavedLocation[];
  photoUri: string | null;
};

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  units: "metric",
  haptics: true,
  reduceMotion: false,
};

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  observationMode: "naked-eye",
  leadMinutes: 15,
  minElevation: 10,
  maxCloud: 30,
  notifications: {
    passAlerts: true,
    launchReminders: true,
    dailyPicture: true,
  },
  sightingVisibility: "private",
};

export const EMPTY_ACCOUNT_PROFILE: AccountProfile = {
  settings: DEFAULT_ACCOUNT_SETTINGS,
  locations: [],
  photoUri: null,
};
