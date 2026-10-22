import { Text, View } from "react-native";

type StatProps = {
  label: string;
  value: string;
};

export function Stat({ label, value }: StatProps) {
  return (
    <View className="py-2" accessible accessibilityLabel={`${label}: ${value}`}>
      <Text className="text-[10px] uppercase tracking-[3px] text-muted">
        {label}
      </Text>
      <Text
        className="mt-1 text-lg text-ink"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
    </View>
  );
}
