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

export const HERO_HEIGHT = 460;
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
      style={{ height: HERO_HEIGHT }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: HERO_HEIGHT,
          },
          stretch,
        ]}
      >
        <Image
          source={{ uri: picture.imageUrl }}
          placeholder={{ uri: picture.thumbnailUrl }}
          contentFit="cover"
          transition={400}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          },
          star,
        ]}
      >
        <Icon name="starFilled" size={72} color={colors.gold} />
      </Animated.View>
    </Pressable>
  );
}
