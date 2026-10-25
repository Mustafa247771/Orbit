import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRef } from "react";
import { Pressable } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { Icon } from "@/components/ui/Icon";
import colors from "@/theme/colors";
import type { SpacePicture } from "../model/SpacePicture";

export const HERO_HEIGHT = 460; // keep in sync with h-[460px] below
const DOUBLE_TAP_MS = 280;

type PictureHeroProps = {
  picture: SpacePicture;
  scrollY: SharedValue<number>;
  onDoubleTap: () => void;
};

export function PictureHero({
  picture,
  scrollY,
  onDoubleTap,
}: PictureHeroProps) {
  const reduceMotion = useReducedMotion();
  const lastTap = useRef(0);
  const burst = useSharedValue(0);

  const stretch = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const y = scrollY.get();
    return {
      transform: [
        {
          translateY: interpolate(
            y,
            [-HERO_HEIGHT, 0],
            [-HERO_HEIGHT / 2, 0],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(y, [-HERO_HEIGHT, 0], [2, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const star = useAnimatedStyle(() => ({
    opacity: burst.get(),
    transform: [{ scale: 0.6 + burst.get() * 0.6 }],
  }));

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current > DOUBLE_TAP_MS) {
      lastTap.current = now;
      return;
    }
    lastTap.current = 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDoubleTap();
    burst.set(
      withSequence(
        withTiming(1, { duration: 160 }),
        withTiming(0, { duration: 420 }),
      ),
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="imagebutton"
      accessibilityLabel={picture.title}
      accessibilityHint="Double-tap to save"
      className="h-[460px]"
    >
      <Animated.View
        className="absolute inset-x-0 top-0 h-[460px]"
        style={stretch}
      >
        <Image
          source={{ uri: picture.imageUrl }}
          placeholder={{ uri: picture.thumbnailUrl }}
          contentFit="cover"
          transition={400}
          className="flex-1"
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center"
        style={star}
      >
        <Icon name="starFilled" size={72} color={colors.gold} />
      </Animated.View>
    </Pressable>
  );
}
