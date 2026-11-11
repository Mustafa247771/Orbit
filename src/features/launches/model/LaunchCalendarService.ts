import { Platform } from "react-native";
import type { Launch } from "./Launch";

/** Open the OS calendar editor. The user confirms the event before saving. */
export async function addLaunchToCalendar(launch: Launch) {
  if (Platform.OS === "web") throw new Error("Calendar events require an iOS or Android device.");
  const startDate = new Date(launch.net);
  if (!Number.isFinite(startDate.getTime())) throw new Error("The launch has no valid scheduled time.");
  const Calendar = await import("expo-calendar/legacy");
  const permission = await Calendar.requestCalendarPermissionsAsync();
  if (!permission.granted) throw new Error("Allow Orbit to access Calendar in your device settings.");
  const windowEnd = Date.parse(launch.windowEnd);
  await Calendar.createEventInCalendarAsync({
    title: `Rocket launch: ${launch.name}`,
    startDate,
    endDate: new Date(Number.isFinite(windowEnd) ? Math.max(startDate.getTime() + 3600000, windowEnd) : startDate.getTime() + 3600000),
    location: `${launch.pad}, ${launch.location}`,
    notes: `${launch.mission}\n${launch.description}\nScheduled launches can be delayed. Confirm before travel.`,
    alarms: [{ relativeOffset: -60 }],
  });
}
