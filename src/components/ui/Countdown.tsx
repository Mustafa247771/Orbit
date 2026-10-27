import { Text, View } from "react-native";

import { Label } from "./Label";

const pad = (value: number) => String(value).padStart(2, "0");

type CountdownProps = {
  seconds: number;
  /** Show a days unit; otherwise hours keep counting past 24. */
  showDays?: boolean;
};

/** Big ticking digits: DD : HH : MM : SS. */
export function Countdown({ seconds, showDays = false }: CountdownProps) {
  const total = Math.max(0, Math.floor(seconds));
  const units = [
    ...(showDays ? [{ label: "Days", value: Math.floor(total / 86400) }] : []),
    {
      label: "Hrs",
      value: Math.floor((showDays ? total % 86400 : total) / 3600),
    },
    { label: "Min", value: Math.floor((total % 3600) / 60) },
    { label: "Sec", value: total % 60 },
  ];

  return (
    <View
      accessible
      accessibilityLabel={units
        .map((unit) => `${unit.value} ${unit.label}`)
        .join(", ")}
      className="flex-row items-start justify-center"
    >
      {units.map((unit, index) => (
        <View key={unit.label} className="flex-row items-start">
          {index > 0 ? (
            <Text className="font-mono text-[26px] leading-[34px] text-cyan">
              :
            </Text>
          ) : null}
          <View className="min-w-[56px] items-center gap-1">
            <Text className="font-mono text-[28px] leading-[34px] text-ink">
              {pad(unit.value)}
            </Text>
            <Label>{unit.label}</Label>
          </View>
        </View>
      ))}
    </View>
  );
}
