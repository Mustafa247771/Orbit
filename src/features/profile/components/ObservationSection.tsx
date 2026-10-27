import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SettingRow } from "@/components/ui/SettingRow";
import type { ProfileSettings } from "../model/Profile";
import type { UpdateSetting } from "../viewmodels/useProfileViewModel";
import { RangeSetting } from "./RangeSetting";
import { Stepper } from "./Stepper";

const MODES = [
  { value: "naked-eye", label: "Naked eye" },
  { value: "telescope", label: "Telescope" },
] as const;

type ObservationSectionProps = {
  settings: ProfileSettings;
  onUpdate: UpdateSetting;
  onChangeLeadTime: (direction: 1 | -1) => void;
};

/** How and when Orbit alerts you about passes. */
export function ObservationSection({
  settings,
  onUpdate,
  onChangeLeadTime,
}: ObservationSectionProps) {
  return (
    <View className="mx-5 mt-8">
      <SectionLabel title="Observation" />
      <Card>
        <View className="gap-3 border-b border-line p-4">
          <View className="gap-1">
            <Text className="text-[15px] font-semibold text-ink">
              Observation mode
            </Text>
            <Text className="text-[13px] leading-[18px] text-muted">
              Telescope also alerts you for satellites you track.
            </Text>
          </View>
          <SegmentedControl
            label="Observation mode"
            options={MODES}
            value={settings.mode}
            onChange={(mode) => onUpdate("mode", mode)}
          />
        </View>
        <SettingRow label="Alert before a pass" hint="Lead time for alerts">
          <Stepper
            label="lead time"
            value={`${settings.alertLeadMinutes} min`}
            onDecrease={() => onChangeLeadTime(-1)}
            onIncrease={() => onChangeLeadTime(1)}
          />
        </SettingRow>
        <RangeSetting
          label="Minimum elevation"
          value={settings.minElevation}
          unit="°"
          min={0}
          max={45}
          step={5}
          minLabel="Horizon"
          maxLabel="45°"
          onChange={(value) => onUpdate("minElevation", value)}
        />
        <RangeSetting
          label="Maximum cloud cover"
          value={settings.maxCloudCover}
          unit="%"
          min={0}
          max={100}
          step={10}
          minLabel="Clear"
          maxLabel="Overcast"
          last
          onChange={(value) => onUpdate("maxCloudCover", value)}
        />
      </Card>
    </View>
  );
}
