import { useCallback, useMemo, useState } from "react";

import {
    DEFAULT_SETTINGS,
    SAMPLE_PROFILE,
    type ProfileSettings,
} from "../model/Profile";

const LEAD_STEP_MINUTES = 5;
const LEAD_RANGE = { min: 5, max: 60 };

const degrees = (value: number, positive: string, negative: string) =>
  `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`;

export function useProfileViewModel() {
  const profile = SAMPLE_PROFILE;
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const initials = useMemo(
    () =>
      profile.name
        .split(" ")
        .map((part) => part[0])
        .join(""),
    [profile.name],
  );

  const stats = useMemo(
    () => [
      { label: "Sightings", value: String(profile.sightings) },
      { label: "Badges", value: String(profile.badges) },
      { label: "Followers", value: String(profile.followers) },
    ],
    [profile],
  );

  const locations = useMemo(
    () =>
      profile.locations.map((location) => ({
        ...location,
        coordinates: `${degrees(location.latitude, "N", "S")} · ${degrees(location.longitude, "E", "W")}`,
      })),
    [profile.locations],
  );

  const update = useCallback(
    <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => {
      setSettings((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const changeLeadTime = useCallback((direction: 1 | -1) => {
    setSettings((current) => ({
      ...current,
      alertLeadMinutes: Math.min(
        LEAD_RANGE.max,
        Math.max(
          LEAD_RANGE.min,
          current.alertLeadMinutes + direction * LEAD_STEP_MINUTES,
        ),
      ),
    }));
  }, []);

  return {
    profile,
    initials,
    stats,
    locations,
    settings,
    update,
    changeLeadTime,
  };
}
