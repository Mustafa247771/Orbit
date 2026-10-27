import { Pressable, Text, View } from "react-native";
import { Label } from "./Label";

type SectionAction = {
  label: string;
  onPress: () => void;
};

type SectionLabelProps = {
  title: string;
  action?: SectionAction;
};

export function SectionLabel({ title, action }: SectionLabelProps) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Label accessibilityRole="header">{title}</Label>
      {action && (
        <Pressable
          onPress={action.onPress}
          hitSlop={12}
          accessibilityRole="button"
          className="active:opacity-60"
        >
          <Text className="text-[13px] font-semibold text-cyan">
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
