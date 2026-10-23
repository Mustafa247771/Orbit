import { Pressable } from "react-native";

import { Icon, type IconName } from "./Icon";

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

export function IconButton({ icon, label, onPress }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/80 active:opacity-60"
    >
      <Icon name={icon} />
    </Pressable>
  );
}
