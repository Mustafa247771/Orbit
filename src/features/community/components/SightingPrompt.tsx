import { Pressable, Text } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import colors from "@/theme/colors";

type SightingPromptProps = {
  initials: string;
  onPress: () => void;
};

/** "What did you see tonight?" row that opens the new-sighting screen. */
export function SightingPrompt({ initials, onPress }: SightingPromptProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Log a sighting"
      className="mx-5 mt-4 flex-row items-center gap-3 rounded-full border border-line bg-surface/80 py-2 pl-2 pr-4 active:opacity-60"
    >
      <Avatar initials={initials} size={32} />
      <Text className="flex-1 text-[13px] text-muted">
        What did you see tonight?
      </Text>
      <Icon name="camera" size={19} color={colors.violet} />
    </Pressable>
  );
}
