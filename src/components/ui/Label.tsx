import { Text, type TextProps } from "react-native";

const TONES = {
  muted: "text-muted",
  ink: "text-ink",
  accent: "text-accent",
  mint: "text-mint",
  cyan: "text-cyan",
  violet: "text-violet",
  gold: "text-gold",
  danger: "text-danger",
};

export type LabelTone = keyof typeof TONES;

type LabelProps = TextProps & {
  tone?: LabelTone;
};

/** Small mono caps text for eyebrows, captions and metadata. className is for spacing only. */
export function Label({
  tone = "muted",
  className = "",
  ...props
}: LabelProps) {
  return (
    <Text
      className={`font-mono text-[11px] uppercase tracking-[1.5px] ${TONES[tone]} ${className}`}
      {...props}
    />
  );
}
