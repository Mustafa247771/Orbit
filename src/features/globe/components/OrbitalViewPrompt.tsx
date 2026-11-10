import { Modal, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import {
  CATALOGUE_MODES,
  type CatalogueMode,
} from "@/core/satellites/catalogueFilters";

type OrbitalViewPromptProps = {
  visible: boolean;
  saving: boolean;
  error: string | null;
  onChangeMode: (mode: CatalogueMode) => void;
};

export function OrbitalViewPrompt({
  visible,
  saving,
  error,
  onChangeMode,
}: OrbitalViewPromptProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => undefined}
    >
      <View className="flex-1 justify-center bg-space/70 px-5">
        <View className="gap-4 rounded-3xl border border-line bg-surface p-6">
          <Text className="font-display text-2xl text-ink">
            Choose your orbital view
          </Text>
          <Text className="text-sm leading-5 text-muted">
            You can change this on the globe whenever you like.
          </Text>
          {CATALOGUE_MODES.map((mode) => (
            <Button
              key={mode.value}
              label={mode.label}
              variant="outline"
              disabled={saving}
              onPress={() => onChangeMode(mode.value)}
            />
          ))}
          <FormMessage>{error}</FormMessage>
        </View>
      </View>
    </Modal>
  );
}
