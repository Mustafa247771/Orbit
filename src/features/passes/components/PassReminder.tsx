import { View } from "react-native";

import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SettingRow } from "@/components/ui/SettingRow";
import { Toggle } from "@/components/ui/Toggle";
import { LEAD_TIMES, type LeadTime } from "../viewmodels/usePassesViewModel";

type PassReminderProps = {
  enabled: boolean;
  leadTime: LeadTime;
  onToggle: (enabled: boolean) => void;
  onLeadTimeChange: (leadTime: LeadTime) => void;
};

/** Reminder switch, plus how early to remind once it is on. */
export function PassReminder({
  enabled,
  leadTime,
  onToggle,
  onLeadTimeChange,
}: PassReminderProps) {
  return (
    <Card className="mx-5 mt-4">
      <SettingRow
        label="Pass reminder"
        hint="Alert me before the ISS becomes visible"
        last={!enabled}
      >
        <Toggle label="Pass reminder" value={enabled} onChange={onToggle} />
      </SettingRow>
      {enabled ? (
        <SettingRow label="Remind me" last>
          <View className="w-56">
            <SegmentedControl
              label="Reminder lead time"
              options={LEAD_TIMES}
              value={leadTime}
              onChange={onLeadTimeChange}
              tone="cyan"
            />
          </View>
        </SettingRow>
      ) : null}
    </Card>
  );
}
