import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { BADGES, RANK } from "@/features/achievements/model/sampleAchievements";
import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import { useLogoutViewModel } from "@/features/auth/viewmodels/useLogoutViewModel";
import { sightingRepository } from "@/features/sightings/model/LocalSightingRepository";
import { DEFAULT_ACCOUNT_SETTINGS, LEAD_TIME_OPTIONS } from "../model/Profile";
import { handleOf, initialsOf, nameOf } from "../model/profileNames";
import { useAccountProfile, useDeviceSettings } from "./ProfileProvider";
import { useAvatarViewModel } from "./useAvatarViewModel";
import { useDeleteAccountViewModel } from "./useDeleteAccountViewModel";
import { useEditProfileViewModel } from "./useEditProfileViewModel";
import { useLocationsViewModel } from "./useLocationsViewModel";
import { useManageLocations } from "./useManageLocations";
import { useNotificationSettings } from "./useNotificationSettings";

const BADGES_EARNED = BADGES.filter((badge) => badge.earnedAt !== null).length;

function memberSince(createdAt: string | null): string | null {
  if (!createdAt) return null;

  return new Date(createdAt).toLocaleDateString([], {
    month: "short",
    year: "numeric",
  });
}

export function useProfileViewModel() {
  const logout = useLogoutViewModel();
  const { user } = useAuthSession();
  const account = useAccountProfile();
  const device = useDeviceSettings();
  const edit = useEditProfileViewModel();
  const avatar = useAvatarViewModel();
  const locationManager = useLocationsViewModel();
  const manageLocations = useManageLocations();
  const deleteAccount = useDeleteAccountViewModel();
  const notifications = useNotificationSettings();
  const [sightingCount, setSightingCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      sightingRepository
        .list()
        .then((sightings) => setSightingCount(sightings.length))
        .catch(() => setSightingCount(0));
    }, []),
  );

  const name = user ? nameOf(user) : "Observer";
  const settings = account.profile?.settings ?? DEFAULT_ACCOUNT_SETTINGS;
  const defaultCity = account.defaultLocation?.name ?? null;

  const hero = {
    name,
    handle: user ? handleOf(user) : "observer",
    initials: initialsOf(name),
    rank: `${RANK.title} · Lv ${RANK.level}`,
    city: defaultCity,
    since: memberSince(user?.createdAt ?? null),
  };

  const stats = useMemo(
    () => [
      { label: "Sightings", value: String(sightingCount) },
      { label: "Badges", value: String(BADGES_EARNED) },
    ],
    [sightingCount],
  );

  const changeLeadTime = useCallback(
    (direction: 1 | -1) => {
      const index = LEAD_TIME_OPTIONS.findIndex(
        (value) => value === settings.leadMinutes,
      );
      const next = Math.max(
        0,
        Math.min(LEAD_TIME_OPTIONS.length - 1, index + direction),
      );
      account.updateSettings({
        leadMinutes: LEAD_TIME_OPTIONS[next],
      });
    },
    [account, settings.leadMinutes],
  );

  return {
    hero,
    signOut: logout.logout,
    signingOut: logout.busy,
    accountError: logout.error,
    loading: account.loading,
    storageError: account.error,
    storageNotice: account.notice,
    stats,
    edit,
    avatar,
    locationManager,
    manageLocations,
    deleteAccount,
    notifications,
    settings,
    deviceSettings: device.settings,
    updateDevice: device.update,
    changeLeadTime,
    version: Constants.expoConfig?.version ?? "",
  };
}
