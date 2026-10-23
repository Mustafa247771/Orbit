import Slider from "@react-native-community/slider";
import { Text, View } from "react-native";

import colors from "@/theme/colors";

type RangeSettingProps = {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
  last?: boolean;
  onChange: (value: number) => void;
};

export function RangeSetting({
  label,
  value,
  unit,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  last = false,
  onChange,
}: RangeSettingProps) {
  return (
    <View className={`gap-2 px-4 py-4 ${last ? "" : "border-b border-line"}`}>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[15px] font-semibold text-ink">{label}</Text>
        <Text
          className="font-mono text-[12px] text-accent"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {`${value}${unit}`}
        </Text>
      </View>
      <Slider
        accessibilityLabel={label}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.line}
        thumbTintColor={colors.accent}
      />
      <View className="flex-row justify-between">
        <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
          {minLabel}
        </Text>
        <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
          {maxLabel}
        </Text>
      </View>
    </View>
  );
}
