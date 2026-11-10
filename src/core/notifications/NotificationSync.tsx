import { useEffect } from "react";
import { AppState, Platform } from "react-native";

import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import type { Launch } from "@/features/launches/model/Launch";
import { launchService } from "@/features/launches/model/LaunchService";
import { useAccountProfile } from "@/features/profile/viewmodels/ProfileProvider";
import {
  cancelAppNotifications,
  syncNotifications,
} from "./NotificationService";

export function useNotificationSync() {
  const uid = useAuthSession().user?.uid ?? null;
  const { profile } = useAccountProfile();
  const launchReminders = Boolean(
    profile?.settings.notifications?.launchReminders,
  );
  const dailyPicture = Boolean(profile?.settings.notifications?.dailyPicture);
  const leadMinutes = profile?.settings.leadMinutes ?? 15;

  useEffect(() => {
    if (Platform.OS === "web") return;
    let request = 0;

    async function sync() {
      const current = ++request;
      if (!uid) {
        await cancelAppNotifications();
        return;
      }
      // null = launches unavailable (offline): keep existing launch reminders.
      let launches: Launch[] | null = [];
      if (launchReminders) {
        try {
          launches = (await launchService.getUpcoming()).launches;
        } catch {
          launches = null;
        }
      }
      if (current !== request) return;

      await syncNotifications(
        { launchReminders, dailyPicture, leadMinutes },
        launches,
      );
    }

    void sync();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync();
    });
    return () => {
      request += 1;
      subscription.remove();
    };
  }, [uid, launchReminders, dailyPicture, leadMinutes]);
}

export function NotificationSync() {
  useNotificationSync();
  return null;
}
