import * as Notifications from "expo-notifications";
import { router } from "expo-router";
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
import {
  type NotificationTarget,
  notificationTarget,
} from "./notificationTarget";

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

let handledResponseKey: string | null = null;
let pendingHref: NotificationTarget | null = null;

function useNotificationTap() {
  const { ready, canAccessAccount } = useAuthSession();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (response) {
      const key = `${response.notification.request.identifier}:${response.notification.date}`;
      if (handledResponseKey !== key) {
        handledResponseKey = key;
        if (
          response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
        ) {
          pendingHref = notificationTarget(
            response.notification.request.content.data,
          );
        }
      }
    }
    if (!pendingHref || !ready || !canAccessAccount) return;
    const href = pendingHref;
    pendingHref = null;
    router.navigate(href);
  }, [response, ready, canAccessAccount]);
}

export function NotificationSync() {
  useNotificationSync();
  useNotificationTap();
  return null;
}
