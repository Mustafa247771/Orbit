import { View } from "react-native";

import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SettingRow } from "@/components/ui/SettingRow";
import { Toggle } from "@/components/ui/Toggle";
import type { ProfileSettings } from "../model/Profile";
import type { UpdateSetting } from "../viewmodels/useProfileViewModel";

const NOTIFICATIONS = [
  { key: "passAlerts", label: "Visible pass alerts" },
  { key: "launchReminders", label: "Launch reminders" },
  { key: "communityReplies", label: "Community replies" },
  { key: "dailyPicture", label: "NASA picture each morning" },
] as const;

type NotificationsSectionProps = {
  settings: ProfileSettings;
  onUpdate: UpdateSetting;
};

/** One switch per kind of alert. */
export function NotificationsSection({
  settings,
  onUpdate,
}: NotificationsSectionProps) {
  return (
    <View className="mx-5 mt-8">
      <SectionLabel title="Notifications" />
      <Card>
        {NOTIFICATIONS.map(({ key, label }, index) => (
          <SettingRow
            key={key}
            label={label}
            last={index === NOTIFICATIONS.length - 1}
          >
            <Toggle
              label={label}
              value={settings[key]}
              onChange={(value) => onUpdate(key, value)}
            />
          </SettingRow>
        ))}
      </Card>
    </View>
  );
}
