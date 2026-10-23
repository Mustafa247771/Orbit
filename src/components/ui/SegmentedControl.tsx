import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

const TONES = {
  accent: "border-accent/50 bg-accent/15",
  cyan: "border-cyan/50 bg-cyan/15",
  gold: "border-gold/50 bg-gold/15",
};

type Option<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  tone?: keyof typeof TONES;
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  tone = "accent",
}: SegmentedControlProps<T>) {
  const choose = (next: T) => {
    if (next === value) return;
    Haptics.selectionAsync();
    onChange(next);
  };

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="flex-row rounded-full border border-line bg-space/60 p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => choose(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            className={`h-10 flex-1 items-center justify-center rounded-full border ${selected ? TONES[tone] : "border-transparent"}`}
          >
            <Text
              className={`text-sm ${selected ? "font-semibold text-ink" : "text-muted"}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
