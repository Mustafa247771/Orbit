import { Pressable, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SettingRow } from "@/components/ui/SettingRow";
import { Tag } from "@/components/ui/Tag";
import colors from "@/theme/colors";
import type { LocationView } from "../viewmodels/useProfileViewModel";

type ObservatorySectionProps = {
  locations: readonly LocationView[];
  onManage: () => void;
  onAdd: () => void;
};

/** Saved observing spots, with the default one tagged. */
export function ObservatorySection({
  locations,
  onManage,
  onAdd,
}: ObservatorySectionProps) {
  return (
    <View className="mx-5 mt-8">
      <SectionLabel
        title="Observatory"
        action={{ label: "Manage", onPress: onManage }}
      />
      <Card>
        {locations.map((location) => (
          <SettingRow
            key={location.id}
            label={location.name}
            hint={location.coordinates}
            monoHint
          >
            {location.isDefault ? (
              <Tag label="Default" tone="accent" />
            ) : (
              <Icon name="chevron" color={colors.muted} />
            )}
          </SettingRow>
        ))}
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          className="active:opacity-60"
        >
          <SettingRow label="Add a location" last>
            <Icon name="add" color={colors.cyan} />
          </SettingRow>
        </Pressable>
      </Card>
    </View>
  );
}
