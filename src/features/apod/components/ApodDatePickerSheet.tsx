import { useState } from "react";
import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { IconButton } from "@/components/ui/IconButton";
import { Label } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import {
  addDays,
  FIRST_APOD_DATE,
  monthGrid,
  validateApodDate,
} from "../model/apodDates";
import { DayChip } from "./DayChip";

export type ApodDatePickerSheetProps = {
  visible: boolean;
  selected: string;
  today: string;
  onPick: (date: string) => void;
  onClose: () => void;
};

function DatePickerContent({
  selected,
  today,
  onPick,
  onClose,
}: Omit<ApodDatePickerSheetProps, "visible">) {
  const initial = validateApodDate(selected, today) ? today : selected;
  const [input, setInput] = useState(initial);
  const [month, setMonth] = useState(`${initial.slice(0, 7)}-01`);
  const [error, setError] = useState<string | null>(null);
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const last =
    monthGrid(year, monthNumber)
      .flat()
      .filter((date) => date !== null)
      .at(-1) ?? month;
  const previous = `${addDays(month, -1).slice(0, 7)}-01`;
  const next = addDays(last, 1);
  const title = new Date(`${month}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const pick = (date: string) => {
    const message = validateApodDate(date, today);
    setError(message);
    if (message) return;
    onPick(date.trim());
    onClose();
  };

  return (
    <ScrollView
      className="mt-4 shrink"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View className="gap-3 pb-5">
        <TextField
          label="Date (YYYY-MM-DD)"
          placeholder="YYYY-MM-DD"
          value={input}
          maxLength={10}
          returnKeyType="go"
          accessibilityHint={
            error ?? "Choose a date from the NASA APOD archive"
          }
          onChangeText={(text) => {
            setInput(text);
            setError(null);
          }}
          onSubmitEditing={() => pick(input)}
        />
        <FormMessage>{error}</FormMessage>
        <Button label="Explore date" tone="cyan" onPress={() => pick(input)} />
        <View className="mt-3 flex-row items-center gap-2">
          <IconButton
            icon="back"
            label="Previous month"
            disabled={month.slice(0, 7) <= FIRST_APOD_DATE.slice(0, 7)}
            onPress={() => setMonth(previous)}
          />
          <Label tone="ink" className="flex-1 text-center">
            {title}
          </Label>
          <IconButton
            icon="chevron"
            label="Next month"
            disabled={month.slice(0, 7) >= today.slice(0, 7)}
            onPress={() => setMonth(next)}
          />
        </View>
        <View
          className="flex-row"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <Label key={day} className="flex-1 text-center">
              {day}
            </Label>
          ))}
        </View>
        {monthGrid(year, monthNumber).map((week, index) => (
          <View key={`${month}-${index}`} className="flex-row">
            {week.map((date, day) => (
              <View key={date ?? `blank-${day}`} className="min-w-0 flex-1">
                {date ? (
                  <DayChip
                    date={date}
                    today={today}
                    selected={date === selected}
                    disabled={date < FIRST_APOD_DATE || date > today}
                    onPress={() => pick(date)}
                  />
                ) : (
                  <View className="h-11" />
                )}
              </View>
            ))}
          </View>
        ))}
        <Label>{`Archive begins ${FIRST_APOD_DATE}`}</Label>
      </View>
    </ScrollView>
  );
}

export function ApodDatePickerSheet({
  visible,
  selected,
  today,
  onPick,
  onClose,
}: ApodDatePickerSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close date picker"
      eyebrow="NASA archive"
      title="Choose a discovery"
    >
      {visible ? (
        <DatePickerContent
          key={`${selected}-${today}`}
          selected={selected}
          today={today}
          onPick={onPick}
          onClose={onClose}
        />
      ) : null}
    </Sheet>
  );
}
