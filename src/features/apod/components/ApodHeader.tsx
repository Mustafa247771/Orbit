import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";

import { Icon } from "@/components/ui/Icon";
import colors from "@/theme/colors";

export function ApodHeader() {
  return (
    <>
      <View className="h-[48px] flex-row items-center justify-between px-3">
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          accessibilityRole="button"
          accessibilityLabel="Back to globe"
          className="h-[44px] w-[44px] items-center justify-center active:opacity-60"
        >
          <Icon name="back" size={21} />
        </Pressable>

        <View className="flex-row items-start">
          <Text className="font-display text-[23px] tracking-[-1px] text-ink">
            orbit
          </Text>
          <Text className="ml-0.5 text-[12px] text-cyan">✦</Text>
        </View>

        <Pressable
          disabled
          accessibilityLabel="Saved pictures"
          className="h-[44px] w-[44px] items-center justify-center"
        >
          <Icon name="bookmark" size={21} />
        </Pressable>
      </View>

      <View className="px-6 pt-2">
        <View className="flex-row items-center justify-between gap-3">
          <View className="h-[100px] max-w-[270px] flex-1">
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 290 110"
              accessible
              accessibilityLabel="APOD"
            >
              <SvgText
                x={0}
                y={91}
                fontFamily="SpaceGrotesk_600SemiBold"
                fontSize={98}
                letterSpacing={-5}
                fill={colors.ink}
              >
                AP
              </SvgText>
              <SvgText
                x={126}
                y={91}
                fontFamily="SpaceGrotesk_600SemiBold"
                fontSize={98}
                fill="none"
                stroke={colors.ink}
                strokeWidth={1}
              >
                O
              </SvgText>
              <SvgText
                x={201}
                y={91}
                fontFamily="SpaceGrotesk_600SemiBold"
                fontSize={98}
                fill={colors.ink}
              >
                D
              </SvgText>
            </Svg>
          </View>

          <Svg width={21} height={21} viewBox="0 0 24 24">
            <Path
              d="M12 1 L14 10 L23 12 L14 14 L12 23 L10 14 L1 12 L10 10 Z"
              fill="none"
              stroke={colors.cyan}
              strokeWidth={1}
            />
          </Svg>
        </View>

        <Text className="mt-1 text-[12px] text-muted">
          Astronomy picture of the day
        </Text>

        <View className="mt-5 flex-row items-center gap-2">
          <View className="mr-1">
            <Text className="text-[12px] text-pale">October</Text>
            <Text className="mt-0.5 text-[10px] text-dusk">2026</Text>
          </View>

          <View className="flex-1 flex-row items-center justify-between">
            {[23, 24, 25, 26, 27, 28].map((day) => (
              <View
                key={day}
                className={
                  day === 26
                    ? "h-[32px] w-[32px] items-center justify-center rounded-full bg-gold"
                    : "h-[32px] w-[24px] items-center justify-center"
                }
              >
                <Text
                  className={
                    day === 26
                      ? "text-[11px] font-semibold text-space"
                      : day > 26
                        ? "text-[11px] text-line"
                        : "text-[11px] text-muted"
                  }
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            disabled
            accessibilityLabel="Open calendar"
            className="h-[44px] w-[28px] items-center justify-center"
          >
            <Icon name="calendar" size={18} color={colors.haze} />
          </Pressable>
        </View>
      </View>
    </>
  );
}
