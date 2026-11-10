import { View } from "react-native";

import { Card } from "@/components/ui/Card";
import { FormMessage } from "@/components/ui/FormMessage";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SettingRow } from "@/components/ui/SettingRow";
import { Toggle } from "@/components/ui/Toggle";
import type { NotificationSettings } from "../model/Profile";
import { Stepper } from "./Stepper";

const NOTIFICATIONS = [
  {
    key: "launchReminders",
    label: "Launch reminders",
    hint: "Reminders for the next 10 launches, using your reminder lead time.",
  },
  {
    key: "dailyPicture",
    label: "NASA picture each morning",
    hint: "A reminder to view today's space picture at 09:00 local time.",
  },
] as const;

type NotificationsSectionProps = {
  settings: NotificationSettings;
  onToggle: (key: keyof NotificationSettings, value: boolean) => void;
  error: string | null;
  leadMinutes: number;
  onChangeLeadTime: (direction: 1 | -1) => void;
};

/** One switch per kind of alert, plus the reminder lead time. */
export function NotificationsSection({
  settings,
  onToggle,
  error,
  leadMinutes,
  onChangeLeadTime,
}: NotificationsSectionProps) {
  return (
    <View className="mx-5 mt-8">
      <SectionLabel title="Notifications" />
      <Card>
        {NOTIFICATIONS.map(({ key, label, hint }, index) => (
          <SettingRow
            key={key}
            label={label}
            hint={hint}
          >
            <Toggle
              label={label}
              value={settings[key]}
              onChange={(value) => onToggle(key, value)}
            />
          </SettingRow>
        ))}
        <SettingRow label="Reminder lead time" hint="How early launch reminders fire" last>
          <Stepper
            label="reminder lead time"
            value={`${leadMinutes} min`}
            onDecrease={() => onChangeLeadTime(-1)}
            onIncrease={() => onChangeLeadTime(1)}
          />
        </SettingRow>
      </Card>
      <FormMessage className="mt-3">{error}</FormMessage>
    </View>
  );
}
