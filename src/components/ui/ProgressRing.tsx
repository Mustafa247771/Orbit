import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import colors from "@/theme/colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProgressRingProps = {
  size: number;
  stroke: number;
  progress: number;
  color: string;
  children?: ReactNode;
};

/** A ring that fills clockwise from the top to `progress` (0 to 1). */
export function ProgressRing({
  size,
  stroke,
  progress,
  color,
  children,
}: ProgressRingProps) {
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(reduceMotion ? progress : 0);
  const center = size / 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    shown.set(
      reduceMotion
        ? progress
        : withTiming(progress, {
            duration: 900,
            easing: Easing.out(Easing.cubic),
          }),
    );
  }, [progress, reduceMotion, shown]);

  const fill = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - shown.get()),
  }));

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} className="absolute inset-0">
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.line}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          fill="none"
          rotation={-90}
          origin={`${center}, ${center}`}
          animatedProps={fill}
        />
      </Svg>
      {children}
    </View>
  );
}
