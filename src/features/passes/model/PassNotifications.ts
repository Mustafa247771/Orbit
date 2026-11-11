import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { PredictedPass } from "./PassPredictionService";

const PREFIX = "orbit:pass:";
let pending = Promise.resolve();

async function sync(enabled: boolean, minutes: number, passes: PredictedPass[], noradId: number) {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const old of scheduled) {
    if (old.identifier.startsWith(PREFIX)) await Notifications.cancelScheduledNotificationAsync(old.identifier);
  }
  if (!enabled || noradId !== 25544) return; // Default observation mode: naked-eye ISS only.
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) return;
  let count = 0;
  for (const pass of passes) {
    if (!pass.opticallyVisible) continue;
    const alertAt = pass.startAt - minutes * 60000;
    if (alertAt <= Date.now() + 15000) continue;
    if (count++ >= 20) break;
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${pass.id}`,
      content: {
        title: "ISS pass approaching",
        body: `A visible ISS pass is predicted in ${minutes} minutes. ${pass.direction}, maximum elevation ${Math.round(pass.peakElevation)}°.`,
        data: { href: "/passes/25544" },
        sound: "default",
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(alertAt) },
    });
  }
}

export function syncPassReminders(enabled: boolean, minutes: number, passes: PredictedPass[], noradId: number) {
  const next = pending.then(() => sync(enabled, minutes, passes, noradId));
  pending = next.catch(() => undefined);
  return next;
}
