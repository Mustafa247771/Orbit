import { View } from "react-native";

import { IconButton } from "@/components/ui/IconButton";
import { Label } from "@/components/ui/Label";
import { FIRST_APOD_DATE } from "../model/apodDates";
import { DayChip } from "./DayChip";

export type WeekStripProps = {
  days: readonly string[];
  selected: string;
  today: string;
  onSelect: (date: string) => void;
  onOpenPicker: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function WeekStrip({
  days,
  selected,
  today,
  onSelect,
  onOpenPicker,
  onPrev,
  onNext,
}: WeekStripProps) {
  const month = new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <View className="mx-5 mt-5 gap-3">
      <View className="flex-row items-center gap-2">
        <IconButton
          icon="back"
          label="Previous day"
          disabled={selected <= FIRST_APOD_DATE}
          onPress={onPrev}
        />
        <Label tone="ink" className="flex-1 text-center">
          {month}
        </Label>
        <IconButton
          icon="chevron"
          label="Next day"
          disabled={selected >= today}
          onPress={onNext}
        />
        <IconButton
          icon="calendar"
          label="Choose an APOD date"
          onPress={onOpenPicker}
        />
      </View>
      <View className="flex-row gap-1">
        {days.map((date) => (
          <View key={date} className="min-w-0 flex-1">
            <DayChip
              date={date}
              today={today}
              selected={date === selected}
              disabled={date < FIRST_APOD_DATE || date > today}
              onPress={() => onSelect(date)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
