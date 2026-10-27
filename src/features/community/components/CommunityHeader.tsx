import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Svg, {
    Circle,
    Ellipse,
    G,
    Path,
    Text as SvgText,
} from "react-native-svg";

import { Icon } from "@/components/ui/Icon";
import { SAMPLE_PROFILE } from "@/features/profile/model/Profile";
import colors from "@/theme/colors";
import type { Observer } from "../model/Post";
import { SCOPES, type FeedScope } from "../viewmodels/useCommunityViewModel";

const POINTS = [
  { x: 54, y: 84, tint: colors.violet },
  { x: 142, y: 38, tint: colors.cyan },
  { x: 235, y: 78, tint: colors.rose.light },
  { x: 310, y: 29, tint: colors.mint },
];

type Props = {
  observers: readonly Observer[];
  moreObservers: number;
  clearSkies: number;
  scope: FeedScope;
  onScopeChange: (scope: FeedScope) => void;
  onLogSighting: () => void;
  onSearch?: () => void;
};

export function CommunityHeader({
  observers,
  moreObservers,
  clearSkies,
  scope,
  onScopeChange,
  onLogSighting,
  onSearch,
}: Props) {
  const visible = observers.slice(0, POINTS.length);
  const more = moreObservers + Math.max(0, observers.length - POINTS.length);
  const initials = SAMPLE_PROFILE.name
    .split(" ")
    .map((part) => part[0])
    .join("");

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
          <Icon name="back" size={20} />
        </Pressable>

        <View className="flex-row items-start">
          <Text className="font-display text-[23px] tracking-[-1px] text-ink">
            orbit
          </Text>
          <Text className="ml-0.5 text-[12px] text-violet">✦</Text>
        </View>

        <Pressable
          onPress={onSearch}
          disabled={!onSearch}
          accessibilityRole="button"
          accessibilityLabel="Search observers"
          className="h-[44px] w-[44px] items-center justify-center active:opacity-60"
        >
          <Icon name="search" size={20} />
        </Pressable>
      </View>

      <View className="px-6 pt-4">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-[11px] text-haze">The shared sky</Text>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              className="mt-1 font-display text-[40px] tracking-[-1.7px] text-ink"
            >
              Community<Text className="text-violet">.</Text>
            </Text>
          </View>

          <Svg width={39} height={39} viewBox="0 0 40 40">
            <G fill="none" stroke={colors.violet} strokeWidth={0.8}>
              <Ellipse
                cx={20}
                cy={20}
                rx={18}
                ry={8}
                rotation={-43}
                origin="20,20"
              />
              <Circle cx={20} cy={20} r={11} />
              <Circle
                cx={32}
                cy={8}
                r={3}
                fill={colors.violet}
                stroke={colors.space}
                strokeWidth={2}
              />
            </G>
          </Svg>
        </View>

        <Text className="mt-2 text-[11px] text-muted">
          <Text className="font-semibold text-violet">{clearSkies}</Text>
          {" observers under clear skies"}
        </Text>

        <View className="mt-4 aspect-[360/154]">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 360 154"
            accessible
            accessibilityLabel={`Community observers: ${visible
              .map((observer) => observer.name)
              .join(", ")}`}
          >
            <G fill="none" stroke={colors.edge.DEFAULT} strokeWidth={0.8}>
              <Path d="M-12 132Q180-21 372 132" />
              <Path d="M-12 143Q180 4 372 143" opacity={0.35} />
              <Path
                d="M54 84 142 38 235 78 310 29"
                stroke={colors.violet}
                strokeOpacity={0.5}
                strokeDasharray="2 5"
              />
              <Path
                d="M54 84 235 78M142 38 310 29"
                strokeDasharray="2 5"
                opacity={0.4}
              />
              <Path d="M190 13v8m-4-4h8M17 40v6m-3-3h6" stroke={colors.haze} />
            </G>

            {visible.map((observer, index) => {
              const point = POINTS[index];

              return (
                <G
                  key={observer.id}
                  transform={`translate(${point.x}, ${point.y})`}
                >
                  <Circle r={25} fill={colors.space} />
                  <Circle
                    r={20}
                    fill={point.tint}
                    fillOpacity={0.16}
                    stroke={point.tint}
                    strokeOpacity={0.5}
                  />
                  <SvgText
                    y={4}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily="SpaceGrotesk_600SemiBold"
                    fill={point.tint}
                  >
                    {observer.initials}
                  </SvgText>

                  {observer.online && (
                    <Circle
                      cx={14}
                      cy={14}
                      r={4}
                      fill={colors.mint}
                      stroke={colors.space}
                      strokeWidth={2}
                    />
                  )}

                  <SvgText
                    y={37}
                    textAnchor="middle"
                    fontSize={10}
                    fill={colors.haze}
                  >
                    {observer.name}
                  </SvgText>
                </G>
              );
            })}

            {more > 0 && (
              <SvgText
                x={180}
                y={150}
                textAnchor="middle"
                fontSize={9}
                fill={colors.mist}
              >
                +{more} more →
              </SvgText>
            )}
          </Svg>
        </View>
      </View>

      <View className="mx-6 mt-5 flex-row items-center border-b border-line">
        <View className="flex-1 flex-row gap-5">
          {SCOPES.map((option) => {
            const active = option.value === scope;

            return (
              <Pressable
                key={option.value}
                onPress={() => onScopeChange(option.value)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                className={
                  active
                    ? "h-[46px] justify-center border-b-2 border-violet"
                    : "h-[46px] justify-center border-b-2 border-transparent"
                }
              >
                <Text
                  className={
                    active
                      ? "text-[13px] font-semibold text-violet"
                      : "text-[13px] text-muted"
                  }
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="ml-2 text-[9px] text-dusk">{SAMPLE_PROFILE.city}</Text>
      </View>

      <Pressable
        onPress={onLogSighting}
        accessibilityRole="button"
        accessibilityLabel="Log a sighting"
        className="flex-row items-center gap-3 border-b border-line/60 px-6 py-4 active:opacity-60"
      >
        <View className="h-[32px] w-[32px] items-center justify-center rounded-full border border-edge bg-panel">
          <Text className="text-[10px] text-haze">{initials}</Text>
        </View>

        <Text className="flex-1 text-[12px] text-muted">
          What did you see tonight?
        </Text>

        <View className="h-[36px] w-[36px] items-center justify-center">
          <Icon name="camera" size={19} color={colors.violet} />
        </View>
      </Pressable>
    </>
  );
}
