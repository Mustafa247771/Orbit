import { Text, View } from "react-native";

const TONES = {
  neutral: { box: "border-line", text: "text-muted", dot: "bg-muted" },
  accent: {
    box: "border-accent/40 bg-accent/10",
    text: "text-accent",
    dot: "bg-accent",
  },
  gold: { box: "border-gold/40 bg-gold/10", text: "text-gold", dot: "bg-gold" },
  cyan: {
    box: "border-cyan/40 bg-space/70",
    text: "text-cyan",
    dot: "bg-cyan",
  },
  dark: { box: "border-line bg-space/80", text: "text-ink", dot: "bg-ink" },
};

type TagProps = {
  label: string;
  tone?: keyof typeof TONES;
  /** A small dot before the label, for live status. */
  dot?: boolean;
};

export function Tag({ label, tone = "neutral", dot = false }: TagProps) {
  const { box, text, dot: dotColor } = TONES[tone];
  return (
    <View
      className={`h-7 flex-row items-center gap-1.5 rounded-full border px-2.5 ${box}`}
    >
      {dot ? <View className={`h-1.5 w-1.5 rounded-full ${dotColor}`} /> : null}
      <Text
        className={`font-mono text-[11px] uppercase tracking-[1.5px] ${text}`}
      >
        {label}
      </Text>
    </View>
  );
}
