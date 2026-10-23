import { Text, View } from "react-native";

const TONES = {
  neutral: { box: "border-line", text: "text-muted" },
  accent: { box: "border-accent/40 bg-accent/10", text: "text-accent" },
  gold: { box: "border-gold/40 bg-gold/10", text: "text-gold" },
  cyan: { box: "border-cyan/40 bg-space/70", text: "text-cyan" },
  dark: { box: "border-line bg-space/80", text: "text-ink" },
};

type TagProps = {
  label: string;
  tone?: keyof typeof TONES;
};

export function Tag({ label, tone = "neutral" }: TagProps) {
  const { box, text } = TONES[tone];
  return (
    <View className={`h-7 justify-center rounded-full border px-2.5 ${box}`}>
      <Text
        className={`font-mono text-[11px] uppercase tracking-[1.5px] ${text}`}
      >
        {label}
      </Text>
    </View>
  );
}
