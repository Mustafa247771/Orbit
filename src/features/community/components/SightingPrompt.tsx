import { View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

type SightingPromptProps = { initials: string; onPress: () => void };

export function SightingPrompt({ initials, onPress }: SightingPromptProps) {
  return (
    <View className="mx-5 mt-4 flex-row items-center gap-2 rounded-full border border-line bg-surface/80 p-2">
      <Avatar initials={initials} size={32} />
      <Button
        label="What did you see tonight?"
        accessibilityLabel="Compose a community post"
        icon="edit"
        variant="ghost"
        tone="cyan"
        className="flex-1 px-2"
        onPress={onPress}
      />
    </View>
  );
}
