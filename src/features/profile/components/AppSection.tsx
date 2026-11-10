import { View } from "react-native";

import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SettingRow } from "@/components/ui/SettingRow";
import { Toggle } from "@/components/ui/Toggle";
import type { DeviceSettings } from "../model/Profile";

const UNITS = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
] as const;

type AppSectionProps = {
  device: DeviceSettings;
  onDeviceChange: (patch: Partial<DeviceSettings>) => void;
};

/** Units, haptics and motion. */
export function AppSection({ device, onDeviceChange }: AppSectionProps) {
  return (
    <View className="mx-5 mt-8">
      <SectionLabel title="App" />
      <Card>
        <SettingRow label="Units">
          <View className="w-44">
            <SegmentedControl
              label="Units"
              options={UNITS}
              value={device.units}
              onChange={(units) => onDeviceChange({ units })}
            />
          </View>
        </SettingRow>
        <SettingRow label="Haptics">
          <Toggle
            label="Haptics"
            value={device.haptics}
            onChange={(haptics) => onDeviceChange({ haptics })}
          />
        </SettingRow>
        <SettingRow label="Reduce motion" hint="Stops the orbit animations" last>
          <Toggle
            label="Reduce motion"
            value={device.reduceMotion}
            onChange={(reduceMotion) => onDeviceChange({ reduceMotion })}
          />
        </SettingRow>
      </Card>
    </View>
  );
}
