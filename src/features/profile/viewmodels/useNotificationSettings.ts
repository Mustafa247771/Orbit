import { useEffect, useRef, useState } from "react";

import { requestPermission } from "@/core/notifications/NotificationService";
import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import {
  DEFAULT_ACCOUNT_SETTINGS,
  type NotificationSettings,
} from "../model/Profile";
import { useAccountProfile } from "./ProfileProvider";

export function useNotificationSettings() {
  const account = useAccountProfile();
  const uid = useAuthSession().user?.uid ?? null;
  const settings =
    account.profile?.settings.notifications ?? DEFAULT_ACCOUNT_SETTINGS.notifications;
  const [error, setError] = useState<string | null>(null);
  const latest = useRef({ account, uid, settings });
  const requests = useRef({ passAlerts: 0, launchReminders: 0, dailyPicture: 0 });

  useEffect(() => {
    latest.current = { account, uid, settings };
  }, [account, uid, settings]);

  useEffect(() => {
    const pending = requests.current;
    return () => {
      pending.passAlerts += 1;
      pending.launchReminders += 1;
      pending.dailyPicture += 1;
    };
  }, [uid]);

  async function toggle(key: keyof NotificationSettings, value: boolean) {
    const current = latest.current;
    if (!current.account.profile || !current.uid) {
      setError("Your profile is not ready. Sign in and try again.");
      return;
    }

    const request = ++requests.current[key];
    setError(null);
    try {
      const allowed = !value || (await requestPermission());
      if (requests.current[key] !== request || latest.current.uid !== current.uid) {
        return;
      }

      const notifications = { ...latest.current.settings, [key]: value && allowed };
      latest.current.settings = notifications;
      latest.current.account.updateSettings({ notifications });
      if (!allowed) {
        setError(
          "Notifications are turned off for Orbit. Allow them in your phone's Settings.",
        );
      }
    } catch {
      if (requests.current[key] === request && latest.current.uid === current.uid) {
        setError("Could not turn on notifications. Please try again.");
      }
    }
  }

  return { settings, toggle, error };
}
