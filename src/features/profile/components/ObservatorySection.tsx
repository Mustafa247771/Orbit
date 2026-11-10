import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormMessage } from "@/components/ui/FormMessage";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SettingRow } from "@/components/ui/SettingRow";
import { Tag } from "@/components/ui/Tag";
import { formatCoordinates } from "../model/LocationService";
import { MAX_LOCATIONS, type SavedLocation } from "../model/Profile";

type ObservatorySectionProps = {
  locations: readonly SavedLocation[];
  onManage: () => void;
  onAdd: () => void;
  canAdd: boolean;
  error?: string | null;
};

/** Saved observing spots, with the default one tagged. */
export function ObservatorySection({
  locations,
  onManage,
  onAdd,
  canAdd,
  error,
}: ObservatorySectionProps) {
  return (
    <View className="mx-5 mt-8">
      <SectionLabel
        title="Observatory"
        action={{ label: "Manage", onPress: onManage }}
      />
      <Card>
        {locations.length === 0 ? (
          <Text className="px-4 py-5 text-sm leading-6 text-muted">
            No observing locations yet. Save a favourite spot to use for your
            observations.
          </Text>
        ) : null}
        {locations.map((location, index) => (
          <SettingRow
            key={location.id}
            label={location.name}
            hint={formatCoordinates(location)}
            monoHint
            last={index === locations.length - 1}
          >
            {location.isDefault ? (
              <Tag label="Default" tone="accent" />
            ) : null}
          </SettingRow>
        ))}
        <View className="border-t border-line p-3">
          <Button
            label="Add a location"
            icon="add"
            tone="cyan"
            variant="ghost"
            onPress={onAdd}
            disabled={!canAdd}
          />
          <FormMessage tone="muted" size="xs" className="px-1">
            {locations.length >= MAX_LOCATIONS
              ? `You have saved ${MAX_LOCATIONS} places. Manage your locations to remove one first.`
              : null}
          </FormMessage>
        </View>
      </Card>
      <FormMessage className="mt-2">{error}</FormMessage>
    </View>
  );
}
