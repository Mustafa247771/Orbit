import { ActivityIndicator, Pressable, Text } from "react-native";

import colors from "@/theme/colors";
import { Icon, type IconName } from "./Icon";

const TONES = {
  accent: {
    solid: "bg-accent",
    outline: "border border-accent/50",
    text: "text-accent",
    color: colors.accent,
  },
  cyan: {
    solid: "bg-cyan",
    outline: "border border-cyan/50",
    text: "text-cyan",
    color: colors.cyan,
  },
  danger: {
    solid: "bg-danger",
    outline: "border border-danger/50",
    text: "text-danger",
    color: colors.danger,
  },
  gold: {
    solid: "bg-gold",
    outline: "border border-gold/50",
    text: "text-gold",
    color: colors.gold,
  },
};

const SIZES = {
  md: "h-11 px-5",
  lg: "h-14 px-6",
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  /** solid: filled, outline: bordered, ghost: text only. */
  variant?: "solid" | "outline" | "ghost";
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  loading?: boolean;
  disabled?: boolean;
  /** Spacing only, e.g. "mt-4". */
  className?: string;
};

export function Button({
  label,
  onPress,
  icon,
  variant = "solid",
  tone = "accent",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
}: ButtonProps) {
  const palette = TONES[tone];
  const solid = variant === "solid";
  const box = solid
    ? palette.solid
    : variant === "outline"
      ? palette.outline
      : "";
  const tint = solid ? colors.space : palette.color;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={`flex-row items-center justify-center gap-2 rounded-full active:opacity-60 ${SIZES[size]} ${box} ${disabled && !loading ? "opacity-40" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : icon ? (
        <Icon name={icon} color={tint} />
      ) : null}
      <Text
        className={`text-[15px] font-semibold ${solid ? "text-space" : palette.text}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
