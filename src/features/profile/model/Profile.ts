import type { SightingVisibility } from "@/features/sightings/model/Sighting";

export type ObservationMode = "naked-eye" | "telescope";
export type Units = "metric" | "imperial";

export type SavedLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
};

export type Profile = {
  name: string;
  handle: string;
  rank: string;
  level: number;
  city: string;
  memberSince: string;
  sightings: number;
  badges: number;
  followers: number;
  locations: SavedLocation[];
};

export type ProfileSettings = {
  mode: ObservationMode;
  alertLeadMinutes: number;
  minElevation: number;
  maxCloudCover: number;
  passAlerts: boolean;
  launchReminders: boolean;
  communityReplies: boolean;
  dailyPicture: boolean;
  units: Units;
  haptics: boolean;
  reduceMotion: boolean;
  sightingVisibility: SightingVisibility;
};

// Sample observer until accounts exist.
export const SAMPLE_PROFILE: Profile = {
  name: "Nour A.",
  handle: "nour.observes",
  rank: "Orbiter",
  level: 4,
  city: "Cairo, EG",
  memberSince: "Oct 2026",
  sightings: 7,
  badges: 12,
  followers: 86,
  locations: [
    {
      id: "home",
      name: "Home · Cairo",
      latitude: 30.04,
      longitude: 31.24,
      isDefault: true,
    },
    {
      id: "alexandria",
      name: "Alexandria",
      latitude: 31.2,
      longitude: 29.92,
      isDefault: false,
    },
  ],
};

export const DEFAULT_SETTINGS: ProfileSettings = {
  mode: "naked-eye",
  alertLeadMinutes: 15,
  minElevation: 10,
  maxCloudCover: 30,
  passAlerts: true,
  launchReminders: true,
  communityReplies: false,
  dailyPicture: true,
  units: "metric",
  haptics: true,
  reduceMotion: false,
  sightingVisibility: "private",
};
