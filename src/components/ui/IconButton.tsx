import { Pressable } from "react-native";

import { Icon, type IconName } from "./Icon";

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/80 active:opacity-60 disabled:opacity-40"
    >
      <Icon name={icon} />
    </Pressable>
  );
}
