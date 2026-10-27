import { Text, View } from "react-native";

import { Label } from "@/components/ui/Label";
import type { StripDay } from "../viewmodels/useApodViewModel";

type WeekStripProps = {
  month: string;
  year: string;
  days: readonly StripDay[];
};

/** This week's dates with today circled in gold; upcoming days are dimmed. */
export function WeekStrip({ month, year, days }: WeekStripProps) {
  return (
    <View className="mx-5 mt-5 flex-row items-center gap-3">
      <View>
        <Text className="text-[13px] text-ink">{month}</Text>
        <Label className="mt-0.5">{year}</Label>
      </View>

      <View className="flex-1 flex-row items-center justify-between">
        {days.map((day) => (
          <View
            key={day.key}
            accessibilityLabel={
              day.today ? `Today, ${month} ${day.day}` : undefined
            }
            className={`h-8 w-8 items-center justify-center rounded-full ${day.today ? "bg-gold" : ""}`}
          >
            <Text
              className={`text-[12px] ${day.today ? "font-semibold text-space" : day.future ? "text-line" : "text-muted"}`}
            >
              {day.day}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
