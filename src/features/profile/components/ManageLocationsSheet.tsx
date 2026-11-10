import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormMessage } from "@/components/ui/FormMessage";
import { Label } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { formatCoordinates } from "../model/LocationService";
import type { SavedLocation } from "../model/Profile";
import { PLACE_NAME_MAX } from "../model/profileValidation";

type ManageLocationsSheetProps = {
  visible: boolean;
  locations: readonly SavedLocation[];
  saving: boolean;
  renameNames: Record<string, string>;
  renameErrors: Record<string, string | null>;
  error: string | null;
  onClose: () => void;
  onChangeName: (id: string, value: string) => void;
  onRename: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ManageLocationsSheet({
  visible,
  locations,
  saving,
  renameNames,
  renameErrors,
  error,
  onClose,
  onChangeName,
  onRename,
  onSetDefault,
  onDelete,
}: ManageLocationsSheetProps) {
  const inactive = saving;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close manage locations"
      eyebrow="Observatory"
      title="Manage observing locations"
    >
      <FormMessage className="mt-3">{error}</FormMessage>
      <FormMessage tone="muted" size="xs">
        {saving ? "Saving your changes…" : null}
      </FormMessage>
      <ScrollView
        className="mt-4 shrink"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="gap-4 pb-4">
          {locations.length === 0 ? (
            <Text className="py-4 text-sm leading-6 text-muted">
              No saved locations. Close this sheet and add an observing spot to
              get started.
            </Text>
          ) : null}
          {locations.map((place) => (
            <Card key={place.id} className="gap-3 p-4">
              <View className="gap-1">
                <Text className="text-base font-semibold text-ink">
                  {place.name}
                </Text>
                <Label>{formatCoordinates(place)}</Label>
                {place.isDefault ? <Label tone="accent">Default</Label> : null}
              </View>
              <TextField
                label={`Name for ${place.name}`}
                value={renameNames[place.id] ?? place.name}
                maxLength={PLACE_NAME_MAX}
                onChangeText={(value) => onChangeName(place.id, value)}
                error={renameErrors[place.id] ?? undefined}
                editable={!inactive}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={() => onRename(place.id)}
              />
              <Button
                label="Save name"
                accessibilityLabel={`Save name for ${place.name}`}
                variant="outline"
                onPress={() => onRename(place.id)}
                disabled={inactive}
              />
              <View className="flex-row flex-wrap gap-2">
                {!place.isDefault ? (
                  <Button
                    label="Set as default"
                    accessibilityLabel={`Set ${place.name} as default`}
                    variant="ghost"
                    onPress={() => onSetDefault(place.id)}
                    disabled={inactive}
                  />
                ) : null}
                <Button
                  label="Delete"
                  accessibilityLabel={`Delete ${place.name}`}
                  variant="ghost"
                  tone="danger"
                  onPress={() => onDelete(place.id)}
                  disabled={inactive}
                />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Sheet>
  );
}
