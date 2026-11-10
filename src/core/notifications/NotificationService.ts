import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  IosAuthorizationStatus,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type NotificationPermissionsStatus,
} from "expo-notifications";
import { Platform } from "react-native";

import type { Launch } from "@/features/launches/model/Launch";

const PREFIX = "orbit:notifications:";
const CHANNEL_ID = "orbit-reminders";
const MAX_LAUNCH_REMINDERS = 10;

type ReminderSettings = {
  launchReminders: boolean;
  dailyPicture: boolean;
  leadMinutes: number;
};

if (Platform.OS !== "web") {
  try {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn("Could not prepare Orbit notifications.", error);
  }
}

async function prepareChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await setNotificationChannelAsync(CHANNEL_ID, {
      name: "Orbit reminders",
      importance: AndroidImportance.HIGH,
      sound: "default",
    });
  }
}

function isAllowed(permission: NotificationPermissionsStatus) {
  return permission.ios
    ? [
        IosAuthorizationStatus.AUTHORIZED,
        IosAuthorizationStatus.PROVISIONAL,
        IosAuthorizationStatus.EPHEMERAL,
      ].includes(permission.ios.status)
    : permission.granted;
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    await prepareChannel();
    const current = await getPermissionsAsync();
    if (isAllowed(current)) return true;
    if (!current.canAskAgain) return false;

    return isAllowed(
      await requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      }),
    );
  } catch (error) {
    console.warn("Could not request Orbit notification permission.", error);
    return false;
  }
}

// Keep native mutations ordered, including cancellation after an in-flight sync.
let pending: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  if (Platform.OS === "web") return Promise.resolve();
  pending = pending.then(task).catch((error) => {
    console.warn("Could not update Orbit notifications.", error);
  });
  return pending;
}

async function cancelScheduledReminders(keepLaunches = false): Promise<void> {
  const scheduled = await getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    const id = notification.identifier;
    if (keepLaunches && id.startsWith(`${PREFIX}launch:`)) continue;
    if (id.startsWith(PREFIX)) {
      await cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export function cancelAppNotifications(): Promise<void> {
  return enqueue(() => cancelScheduledReminders());
}

/** Pass `launches` as null when the launch list could not be loaded: existing launch reminders are kept. */
export function syncNotifications(
  settings: ReminderSettings,
  launches: readonly Launch[] | null,
): Promise<void> {
  return enqueue(async () => {
    const keepLaunches = launches === null && settings.launchReminders;
    await cancelScheduledReminders(keepLaunches);
    if (!settings.launchReminders && !settings.dailyPicture) return;
    if (!isAllowed(await getPermissionsAsync())) {
      if (keepLaunches) await cancelScheduledReminders();
      return;
    }
    await prepareChannel();

    if (settings.dailyPicture) {
      await scheduleNotificationAsync({
        identifier: `${PREFIX}daily-picture`,
        content: {
          title: "Today's space picture is ready",
          body: "Open Orbit to view today's NASA space picture.",
          sound: "default",
          data: { href: "/apod" },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
          channelId: CHANNEL_ID,
        },
      });
    }

    if (!settings.launchReminders || launches === null) return;
    const leadMinutes = Number.isFinite(settings.leadMinutes)
      ? Math.max(0, settings.leadMinutes)
      : 15;
    const now = Date.now();
    const reminders = launches
      .map((launch) => ({
        launch,
        time: Date.parse(launch.net) - leadMinutes * 60_000,
      }))
      .filter(({ time }) => time > now)
      .sort((a, b) => a.time - b.time);
    const scheduled = new Set<string>();

    for (const { launch, time } of reminders) {
      if (scheduled.size >= MAX_LAUNCH_REMINDERS) break;
      if (scheduled.has(launch.id) || time <= Date.now()) continue;
      await scheduleNotificationAsync({
        identifier: `${PREFIX}launch:${launch.id}`,
        content: {
          title: "Upcoming launch",
          body: `${launch.name || launch.mission} launches in ${leadMinutes} minutes.`,
          sound: "default",
          data: { href: "/launches" },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: new Date(time),
          channelId: CHANNEL_ID,
        },
      });
      scheduled.add(launch.id);
    }
  });
}
