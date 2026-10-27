import { ActivityIndicator, Pressable, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SettingRow } from "@/components/ui/SettingRow";
import colors from "@/theme/colors";
import type { SightingLocation } from "../model/Sighting";

type SightingDetailsProps = {
  objectName: string;
  observedLabel: string;
  location: SightingLocation | null;
  locating: boolean;
  disabled: boolean;
  onUseLocation: () => void;
};

/** What was seen, when, and from where. */
export function SightingDetails({
  objectName,
  observedLabel,
  location,
  locating,
  disabled,
  onUseLocation,
}: SightingDetailsProps) {
  return (
    <View className="mx-5 mt-8">
      <SectionLabel title="Details" />
      <Card>
        <SettingRow label={objectName} hint="Object" monoHint />
        <SettingRow label={observedLabel} hint="Observed" monoHint />
        <Pressable
          onPress={onUseLocation}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Attach current location"
          className="active:opacity-60"
        >
          <SettingRow
            label={location?.cityLabel ?? "Use current location"}
            hint={
              location
                ? "Precise coordinates stay private"
                : "Tap to attach GPS coordinates"
            }
            last
          >
            {locating ? (
              <ActivityIndicator color={colors.cyan} />
            ) : (
              <Icon name="location" color={colors.cyan} />
            )}
          </SettingRow>
        </Pressable>
      </Card>
    </View>
  );
}
