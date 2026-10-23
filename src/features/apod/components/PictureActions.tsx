import { Pressable, Text, View } from "react-native";

import { Icon, type IconName } from "@/components/ui/Icon";
import colors from "@/theme/colors";

type ActionProps = {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress: () => void;
};

function Action({ icon, label, active = false, onPress }: ActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border active:opacity-60 ${active ? "border-gold/50 bg-gold/15" : "border-transparent"}`}
    >
      <Icon name={icon} size={18} color={active ? colors.gold : colors.ink} />
      <Text
        className={`text-sm font-semibold ${active ? "text-gold" : "text-ink"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type PictureActionsProps = {
  saved: boolean;
  onToggleSave: () => void;
  onFullView: () => void;
  onShare: () => void;
};

export function PictureActions({
  saved,
  onToggleSave,
  onFullView,
  onShare,
}: PictureActionsProps) {
  return (
    <View className="mx-5 -mt-7 flex-row rounded-full border border-line bg-surface p-1.5">
      <Action
        icon={saved ? "starFilled" : "star"}
        label={saved ? "Saved" : "Save"}
        active={saved}
        onPress={onToggleSave}
      />
      <Action icon="expand" label="Full view" onPress={onFullView} />
      <Action icon="share" label="Share" onPress={onShare} />
    </View>
  );
}
