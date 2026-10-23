import { Text, View } from "react-native";

import { IconButton } from "@/components/ui/IconButton";

type StepperProps = {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
};

export function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
}: StepperProps) {
  return (
    <View className="flex-row items-center">
      <IconButton icon="remove" label={`Less ${label}`} onPress={onDecrease} />
      <Text
        className="w-16 text-center font-mono text-[13px] text-accent"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
      <IconButton icon="add" label={`More ${label}`} onPress={onIncrease} />
    </View>
  );
}
