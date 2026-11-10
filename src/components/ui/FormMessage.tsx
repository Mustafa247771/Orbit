import { Text } from "react-native";

const TONES = {
  danger: "text-danger",
  accent: "text-accent",
  gold: "text-gold",
  muted: "text-muted",
};

type FormMessageProps = {
  children?: string | null;
  tone?: keyof typeof TONES;
  size?: "xs" | "sm";
  /** Spacing only, e.g. "mt-2". */
  className?: string;
};

/** Inline form or status message. Renders nothing when children is empty. */
export function FormMessage({
  children,
  tone = "danger",
  size = "sm",
  className = "",
}: FormMessageProps) {
  if (!children) return null;

  return (
    <Text
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === "danger" ? "alert" : undefined}
      className={`${size === "xs" ? "text-xs leading-5" : "text-sm leading-6"} ${TONES[tone]} ${className}`}
    >
      {children}
    </Text>
  );
}
