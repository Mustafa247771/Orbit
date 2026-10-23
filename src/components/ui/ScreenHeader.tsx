import { router } from "expo-router";
import { Text, View } from "react-native";

import type { IconName } from "./Icon";
import { IconButton } from "./IconButton";

type HeaderAction = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

type ScreenHeaderProps = {
  eyebrow: string;
  title: string;
  action?: HeaderAction;
  floating?: boolean;
};

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export function ScreenHeader({
  eyebrow,
  title,
  action,
  floating = false,
}: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-2">
      <IconButton icon="back" label="Go back" onPress={goBack} />
      <View
        className={
          floating
            ? "items-center rounded-full bg-space/70 px-4 py-1.5"
            : "items-center"
        }
      >
        <Text className="font-mono text-[11px] uppercase tracking-[2px] text-muted">
          {eyebrow}
        </Text>
        <Text className="mt-1 text-base font-semibold text-ink">{title}</Text>
      </View>
      {action ? <IconButton {...action} /> : <View className="h-11 w-11" />}
    </View>
  );
}
