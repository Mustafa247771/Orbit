import { Pressable, Text } from "react-native";

export type DayChipProps = {
  date: string;
  today: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/** One day number in the week strip and the calendar; two digits always stay on one line. */
export function DayChip({ date, today, selected, disabled = false, onPress }: DayChipProps) {
  const isToday = date === today;
  const fill = isToday ? "bg-gold" : "bg-cyan";
  const ink = isToday ? "text-gold" : "text-cyan";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${date}${isToday ? ", today" : ""}${selected ? ", selected" : ""}`}
      accessibilityState={{ disabled, selected }}
      className={`h-11 w-full items-center justify-center rounded-full active:opacity-60 ${selected ? fill : ""} ${disabled ? "opacity-40" : ""}`}
    >
      <Text
        numberOfLines={1}
        className={`text-[15px] font-semibold ${selected ? "text-space" : ink}`}
      >
        {`${Number(date.slice(8))}`}
      </Text>
    </Pressable>
  );
}
