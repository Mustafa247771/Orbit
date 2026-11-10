import { View } from "react-native";

import { IconButton } from "@/components/ui/IconButton";
import { Label } from "@/components/ui/Label";

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
      <View className="w-16 items-center">
        <Label tone="accent">{value}</Label>
      </View>
      <IconButton icon="add" label={`More ${label}`} onPress={onIncrease} />
    </View>
  );
}
