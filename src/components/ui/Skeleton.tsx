import { useEffect } from "react";
import type { DimensionValue } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const PULSE_MS = 800;

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
};

/** Placeholder block that gently pulses while content loads. */
export function Skeleton({
  width = "100%",
  height,
  radius = 8,
}: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.set(withRepeat(withTiming(1, { duration: PULSE_MS }), -1, true));
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      className="bg-surface"
      style={[{ width, height, borderRadius: radius }, pulse]}
    />
  );
}
