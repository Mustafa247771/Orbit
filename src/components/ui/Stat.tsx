import { Text, View } from "react-native";

import { Label } from "./Label";

type StatProps = {
  label: string;
  value: string;
  /** Centre the label and value, e.g. inside a StatRow. */
  center?: boolean;
};

export function Stat({ label, value, center = false }: StatProps) {
  return (
    <View
      className={`gap-1 py-2 ${center ? "items-center" : ""}`}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Label>{label}</Label>
      <Text
        className="text-lg text-ink"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
    </View>
  );
}
