import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import { useEffect, useMemo } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
    type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import colors from "@/theme/colors";
import { CAMERA_FOV } from "./cameraSettings";
import { MENU_TURN, MENU_TURN_MS, turnEasing } from "./menuTurn";

type LabelSide = "left" | "right" | "above";

type MenuStar = {
  label: string;
  star: string;
  href: Href;
  /** 0–1 across the chart. */
  x: number;
  /** 0–1 down the chart. */
  y: number;
  side: LabelSide;
};

// The Big Dipper with Polaris (found from the two "pointer" stars Merak and Dubhe),
// then "arc to Arcturus, spike to Spica" off the end of the handle.
// prettier-ignore
const STARS: MenuStar[] = [
  { label: "Profile", star: "Polaris", href: "/profile", x: 0.06, y: 0.16, side: "above" },
  { label: "Satellite", star: "Dubhe", href: "/satellite/25544", x: 0.34, y: 0.08, side: "above" },
  { label: "Passes", star: "Merak", href: "/passes/25544", x: 0.6, y: 0.02, side: "right" },
  { label: "Sky Finder", star: "Phecda", href: "/sky-finder/25544", x: 0.64, y: 0.19, side: "right" },
  { label: "Log sighting", star: "Megrez", href: "/sightings/new", x: 0.38, y: 0.24, side: "left" },
  { label: "Launches", star: "Alioth", href: "/launches", x: 0.34, y: 0.39, side: "left" },
  { label: "News", star: "Mizar", href: "/spaceflight", x: 0.4, y: 0.52, side: "left" },
  { label: "Space picture", star: "Alkaid", href: "/apod", x: 0.53, y: 0.63, side: "left" },
  { label: "Community", star: "Arcturus", href: "/community", x: 0.7, y: 0.77, side: "left" },
  { label: "Achievements", star: "Spica", href: "/achievements", x: 0.48, y: 1, side: "right" },
];

// Star index pairs, in the order the line draws them. [4, 1] closes the Dipper's bowl.
// prettier-ignore
const LINES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 1],
  [4, 5], [5, 6], [6, 7], [7, 8], [8, 9],
];

const SIDE_MARGIN = 24;
const TOP_SPACE = 160;
const BOTTOM_SPACE = 150;
const LABEL_WIDTH = 130; // keep in sync with w-[130px] below
const DRAW_DELAY_MS = 650;
const DRAW_MS = 1600;
// Drawing runs a little past the last star so it has time to finish blinking.
const DRAW_END = 1.15;
const TWINKLE_MS = 3200;

const LABEL_ALIGN: Record<LabelSide, string> = {
  right: "items-start",
  left: "items-end",
  above: "items-center",
};

type Point = { x: number; y: number };

/** One SVG path through all the lines, and how far along it each star lights up (0–1). */
function buildChart(points: Point[]) {
  let d = "";
  let length = 0;
  let last = -1;
  const reachedAt = points.map(() => -1);
  reachedAt[LINES[0][0]] = 0;

  for (const [from, to] of LINES) {
    const a = points[from];
    const b = points[to];
    if (from !== last) d += `M${a.x} ${a.y} `;
    d += `L${b.x} ${b.y} `;
    length += Math.hypot(b.x - a.x, b.y - a.y);
    if (reachedAt[to] < 0) reachedAt[to] = length;
    last = to;
  }

  return { d, length, lightAt: reachedAt.map((at) => at / length) };
}

function labelOffset(side: LabelSide, { x, y }: Point) {
  if (side === "right") return { left: x + 16, top: y - 16 };
  if (side === "left") return { left: x - 16 - LABEL_WIDTH, top: y - 16 };
  return { left: x - LABEL_WIDTH / 2, top: y - 48 };
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

type ChartStarProps = {
  item: MenuStar;
  point: Point;
  lightAt: number;
  phase: number;
  draw: SharedValue<number>;
  twinkle: SharedValue<number>;
};

function ChartStar({
  item,
  point,
  lightAt,
  phase,
  draw,
  twinkle,
}: ChartStarProps) {
  // Blinks on (on, dim, on) when the line reaches it, then twinkles.
  const starStyle = useAnimatedStyle(() => {
    const progress = draw.get();
    const blink = interpolate(
      progress,
      [lightAt, lightAt + 0.02, lightAt + 0.05, lightAt + 0.08],
      [0, 1, 0.25, 1],
      Extrapolation.CLAMP,
    );
    const pop = interpolate(
      progress,
      [lightAt, lightAt + 0.03, lightAt + 0.12],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    const shimmer = 0.7 + 0.3 * Math.sin((twinkle.get() + phase) * Math.PI * 2);
    return {
      opacity: blink * shimmer,
      transform: [{ scale: 0.5 + blink * 0.5 + pop * 0.8 }],
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      draw.get(),
      [lightAt + 0.03, lightAt + 0.12],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const go = () => {
    Haptics.selectionAsync();
    router.push(item.href);
  };

  return (
    <>
      <Pressable
        onPress={go}
        accessibilityRole="button"
        accessibilityLabel={`${item.label}, ${item.star}`}
        className="absolute h-11 w-11 items-center justify-center active:opacity-60"
        style={{ left: point.x - 22, top: point.y - 22 }}
      >
        <Animated.View style={starStyle}>
          <Svg width={22} height={22} viewBox="0 0 22 22">
            <Path
              d="M11 1 L12.5 9.5 L21 11 L12.5 12.5 L11 21 L9.5 12.5 L1 11 L9.5 9.5 Z"
              fill={colors.ink}
            />
          </Svg>
        </Animated.View>
      </Pressable>

      <View
        className={`absolute w-[130px] ${LABEL_ALIGN[item.side]}`}
        style={labelOffset(item.side, point)}
      >
        <Animated.View style={labelStyle}>
          <Pressable
            onPress={go}
            accessible={false}
            className="rounded-md bg-space/80 px-1.5 py-0.5 active:opacity-60"
          >
            <Text className="font-display text-[13px] text-ink">
              {item.label}
            </Text>
            <Text className="font-mono text-[9px] uppercase tracking-[1.5px] text-muted">
              {item.star}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
}

type ConstellationMenuProps = {
  open: boolean;
};

/** The menu: ten stars that sit off to the right of the globe until the camera turns to them. */
export function ConstellationMenu({ open }: ConstellationMenuProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const points = useMemo(() => {
    const top = insets.top + TOP_SPACE;
    const chartWidth = width - SIDE_MARGIN * 2;
    const chartHeight = height - top - insets.bottom - BOTTOM_SPACE;
    return STARS.map((star) => ({
      x: SIDE_MARGIN + star.x * chartWidth,
      y: top + star.y * chartHeight,
    }));
  }, [width, height, insets.top, insets.bottom]);

  const chart = useMemo(() => buildChart(points), [points]);

  const turn = useSharedValue(0);
  const draw = useSharedValue(0);
  const twinkle = useSharedValue(0);

  useEffect(() => {
    turn.set(
      withTiming(open ? 1 : 0, { duration: MENU_TURN_MS, easing: turnEasing }),
    );
    if (open)
      draw.set(
        withSequence(
          withTiming(0, { duration: 0 }),
          withDelay(
            DRAW_DELAY_MS,
            withTiming(DRAW_END, {
              duration: DRAW_MS,
              easing: Easing.inOut(Easing.quad),
            }),
          ),
        ),
      );
  }, [open, turn, draw]);

  useEffect(() => {
    twinkle.set(
      withRepeat(
        withTiming(1, { duration: TWINKLE_MS, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [twinkle]);

  // Slide exactly as far as a star at the screen's centre moves while the camera turns,
  // so the chart looks fixed in the sky. focal = pixels per unit of tan(angle).
  const focal = height / 2 / Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
  const skyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: focal * Math.tan(MENU_TURN * (1 - turn.get())) }],
  }));

  const total = chart.length;
  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: total * (1 - Math.min(draw.get(), 1)),
  }));

  return (
    <View
      pointerEvents={open ? "auto" : "none"}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
      className="absolute inset-0"
    >
      <Animated.View style={skyStyle}>
        <View className="h-screen w-screen">
          <View pointerEvents="none" className="absolute inset-0">
            <Svg width={width} height={height}>
              <AnimatedPath
                d={chart.d}
                fill="none"
                stroke={colors.cyan}
                strokeOpacity={0.55}
                strokeWidth={1.25}
                strokeLinejoin="round"
                strokeDasharray={[total, total]}
                animatedProps={lineProps}
              />
            </Svg>
          </View>
          {STARS.map((item, i) => (
            <ChartStar
              key={item.label}
              item={item}
              point={points[i]}
              lightAt={chart.lightAt[i]}
              phase={i * 0.37}
              draw={draw}
              twinkle={twinkle}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
