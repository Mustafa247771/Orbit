import { View } from "react-native";

import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SettingRow } from "@/components/ui/SettingRow";
import { Toggle } from "@/components/ui/Toggle";
import { VISIBILITY_OPTIONS } from "@/features/sightings/model/Sighting";
import type { ProfileSettings } from "../model/Profile";
import type { UpdateSetting } from "../viewmodels/useProfileViewModel";

const UNITS = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
] as const;

type AppSectionProps = {
  settings: ProfileSettings;
  onUpdate: UpdateSetting;
};

/** Units, haptics, motion and who sees new sightings. */
export function AppSection({ settings, onUpdate }: AppSectionProps) {
  return (
    <View className="mx-5 mt-8">
      <SectionLabel title="App" />
      <Card>
        <SettingRow label="Units">
          <View className="w-44">
            <SegmentedControl
              label="Units"
              options={UNITS}
              value={settings.units}
              onChange={(units) => onUpdate("units", units)}
            />
          </View>
        </SettingRow>
        <SettingRow label="Haptics">
          <Toggle
            label="Haptics"
            value={settings.haptics}
            onChange={(value) => onUpdate("haptics", value)}
          />
        </SettingRow>
        <SettingRow label="Reduce motion" hint="Stops the orbit animations">
          <Toggle
            label="Reduce motion"
            value={settings.reduceMotion}
            onChange={(value) => onUpdate("reduceMotion", value)}
          />
        </SettingRow>
        <SettingRow label="New sightings" last>
          <View className="w-48">
            <SegmentedControl
              label="New sightings visibility"
              options={VISIBILITY_OPTIONS}
              value={settings.sightingVisibility}
              onChange={(visibility) =>
                onUpdate("sightingVisibility", visibility)
              }
            />
          </View>
        </SettingRow>
      </Card>
    </View>
  );
}
