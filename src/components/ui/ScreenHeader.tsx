import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Icon, type IconName } from "./Icon";

type HeaderAction = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

type ScreenHeaderProps = {
  // Accepted so existing screen usages keep working.
  eyebrow?: string;
  title?: string;
  action?: HeaderAction;
  floating?: boolean;
  starClassName?: string;
};

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export function ScreenHeader({
  action,
  floating = false,
  starClassName = "text-mint",
}: ScreenHeaderProps) {
  return (
    <View className="relative h-14 flex-row items-center justify-between px-3">
      <View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center"
      >
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel="Orbit"
          className={`flex-row items-start ${
            floating ? "rounded-full bg-space/70 px-4 py-1.5" : ""
          }`}
        >
          <Text className="font-display text-[23px] tracking-[-1px] text-ink">
            orbit
          </Text>
          <Text className={`ml-0.5 text-[12px] ${starClassName}`}>✦</Text>
        </View>
      </View>

      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Back to globe"
        className="h-11 w-11 items-center justify-center active:opacity-60"
      >
        <Icon name="back" size={20} />
      </Pressable>

      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          className="h-11 w-11 items-center justify-center active:opacity-60"
        >
          <Icon name={action.icon} size={20} />
        </Pressable>
      ) : (
        <View className="h-11 w-11" />
      )}
    </View>
  );
}
