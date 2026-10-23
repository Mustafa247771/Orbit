import { Pressable, Text, View } from "react-native";

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
      <Text
        accessibilityRole="header"
        className="font-mono text-[11px] uppercase tracking-[2px] text-muted"
      >
        {title}
      </Text>
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
