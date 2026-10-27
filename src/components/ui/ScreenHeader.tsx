import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Icon, type IconName } from "./Icon";
import { Label } from "./Label";

const TONES = {
  mint: "text-mint",
  cyan: "text-cyan",
  violet: "text-violet",
  gold: "text-gold",
};

type HeaderAction = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

type ScreenHeaderProps = {
  title?: string;
  eyebrow?: string;
  subtitle?: ReactNode;
  /** Sits to the right of the title, e.g. a small emblem. */
  trailing?: ReactNode;
  action?: HeaderAction;
  /** The screen's accent colour: the wordmark star and the eyebrow. */
  tone?: keyof typeof TONES;
  children?: ReactNode;
};

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

function HeaderButton({ icon, label, onPress }: HeaderAction) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-11 w-11 items-center justify-center active:opacity-60"
    >
      <Icon name={icon} size={20} />
    </Pressable>
  );
}

/** Top of every screen: back, orbit wordmark, optional action, then the big title. */
export function ScreenHeader({
  title,
  eyebrow,
  subtitle,
  trailing,
  action,
  tone = "mint",
  children,
}: ScreenHeaderProps) {
  return (
    <View>
      <View className="relative h-14 flex-row items-center justify-between px-3">
        <View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center"
        >
          <View
            accessible
            accessibilityLabel="Orbit"
            className="flex-row items-start"
          >
            <Text className="font-display text-[23px] tracking-[-1px] text-ink">
              orbit
            </Text>
            <Text className={`ml-0.5 text-[12px] ${TONES[tone]}`}>✦</Text>
          </View>
        </View>

        <HeaderButton icon="back" label="Back" onPress={goBack} />
        {action ? <HeaderButton {...action} /> : <View className="h-11 w-11" />}
      </View>

      {title ? (
        <View className="flex-row items-center gap-3 px-5 pt-7">
          <View className="flex-1 gap-3">
            {eyebrow ? <Label tone={tone}>{eyebrow}</Label> : null}
            <Text
              accessibilityRole="header"
              className="font-display text-[40px] leading-[42px] tracking-[-1.5px] text-ink"
            >
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-[15px] leading-[22px] text-muted">
                {subtitle}
              </Text>
            ) : null}
            {children ? (
              <View className="flex-row flex-wrap gap-2">{children}</View>
            ) : null}
          </View>
          {trailing}
        </View>
      ) : null}
    </View>
  );
}
