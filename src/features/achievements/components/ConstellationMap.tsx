import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";

import { Icon } from "@/components/ui/Icon";
import { ProgressRing } from "@/components/ui/ProgressRing";
import colors from "@/theme/colors";
import type { BadgeView } from "../viewmodels/useAchievementsViewModel";

const MAP_HEIGHT = 300;
const NODE = 48;
const LABEL_WIDTH = 92;
const TOP = 34;
const BOTTOM = 58;

const STATE_COLORS = {
  earned: colors.gold,
  progress: colors.cyan,
  locked: colors.muted,
};

type BadgeNodeProps = {
  badge: BadgeView;
  x: number;
  y: number;
  onPress: () => void;
};

function BadgeNode({ badge, x, y, onPress }: BadgeNodeProps) {
  const color = STATE_COLORS[badge.state];
  const icon = badge.state === "locked" ? "lock" : badge.icon;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${badge.title}, ${badge.stateLabel}`}
      className="items-center active:opacity-70"
      style={{
        position: "absolute",
        left: x - LABEL_WIDTH / 2,
        top: y - NODE / 2,
        width: LABEL_WIDTH,
      }}
    >
      {badge.state === "progress" ? (
        <ProgressRing
          size={NODE}
          stroke={3}
          progress={badge.percent}
          color={color}
        >
          <Icon name={icon} size={18} color={color} />
        </ProgressRing>
      ) : (
        <View
          className={`items-center justify-center rounded-full border ${badge.state === "earned" ? "border-gold bg-gold/15" : "border-dashed border-line bg-space"}`}
          style={{ width: NODE, height: NODE }}
        >
          <Icon name={icon} size={18} color={color} />
        </View>
      )}
      <Text
        numberOfLines={1}
        className={`mt-1.5 text-[11px] ${badge.state === "earned" ? "font-semibold text-gold" : "text-muted"}`}
      >
        {badge.title}
      </Text>
    </Pressable>
  );
}

type ConstellationMapProps = {
  badges: BadgeView[];
  earnedCount: number;
  onSelect: (id: string) => void;
};

/** Badges as stars; lines between two earned badges light up. */
export function ConstellationMap({
  badges,
  earnedCount,
  onSelect,
}: ConstellationMapProps) {
  const [width, setWidth] = useState(0);

  const point = (badge: BadgeView) => ({
    x: badge.x * width,
    y: TOP + badge.y * (MAP_HEIGHT - TOP - BOTTOM),
  });

  const lines = badges.flatMap((from) =>
    from.links.flatMap((id) => {
      const to = badges.find((badge) => badge.id === id);
      return to ? [{ from, to }] : [];
    }),
  );

  return (
    <View className="mx-5 mt-4 overflow-hidden rounded-[28px] border border-line bg-space/70">
      <View className="flex-row items-center justify-between px-5 pt-4">
        <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-gold">
          {earnedCount} of {badges.length} stars lit
        </Text>
        <Text className="text-xs text-muted">Tap a star</Text>
      </View>

      <View
        style={{ height: MAP_HEIGHT }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <>
            <Svg
              width={width}
              height={MAP_HEIGHT}
              style={StyleSheet.absoluteFill}
            >
              {lines.map(({ from, to }) => {
                const lit = from.state === "earned" && to.state === "earned";
                const a = point(from);
                const b = point(to);
                return (
                  <Line
                    key={`${from.id}-${to.id}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={lit ? colors.gold : colors.line}
                    strokeWidth={lit ? 1.5 : 1}
                    strokeDasharray={lit ? undefined : "3 5"}
                  />
                );
              })}
            </Svg>
            {badges.map((badge) => {
              const { x, y } = point(badge);
              return (
                <BadgeNode
                  key={badge.id}
                  badge={badge}
                  x={x}
                  y={y}
                  onPress={() => onSelect(badge.id)}
                />
              );
            })}
          </>
        ) : null}
      </View>

      <View className="flex-row gap-4 px-5 pb-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full bg-gold" />
          <Text className="text-xs text-ink/80">Lit</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full border-2 border-cyan" />
          <Text className="text-xs text-ink/80">In progress</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full border border-dashed border-muted" />
          <Text className="text-xs text-ink/80">Locked</Text>
        </View>
      </View>
    </View>
  );
}
