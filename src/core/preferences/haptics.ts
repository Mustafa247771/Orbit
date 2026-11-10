import * as Haptics from "expo-haptics";

import { hapticsEnabled } from "./devicePreferences";

function run(task: () => Promise<void>): void {
  if (!hapticsEnabled()) return;
  task().catch(() => undefined);
}

export function selectionHaptic(): void {
  run(() => Haptics.selectionAsync());
}

export function tapHaptic(): void {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function successHaptic(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
