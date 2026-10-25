import { IconButton } from "@/components/ui/IconButton";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { HelmetAvatar } from "./HelmetAvatar";

const PHOTO = 108; // keep in sync with h-[108px] w-[108px] below
const HELMET = 150;
const ORBIT_RADIUS = 90;
const ORBIT_SQUASH = 0.39; // keep in sync with scale-y-[0.39] below
const ORBIT_TILT_DEG = -16; // keep in sync with -rotate-[16deg] below
const LAP_MS = 14_000;

const tilt = (ORBIT_TILT_DEG * Math.PI) / 180;

type ProfileAvatarProps = {
  initials: string;
  still: boolean;
  onChangePhoto: () => void;
};

export function ProfileAvatar({
  initials,
  still,
  onChangePhoto,
}: ProfileAvatarProps) {
  const reduceMotion = useReducedMotion();
  const angle = useSharedValue(0);
  const moving = !still && !reduceMotion;

  const [helmetReady, setHelmetReady] = useState(false);
  const showHelmet = useCallback(() => setHelmetReady(true), []);

  useEffect(() => {
    if (!moving) return;
    angle.set(
      withRepeat(
        withTiming(angle.get() + 2 * Math.PI, {
          duration: LAP_MS,
          easing: Easing.linear,
        }),
        -1,
      ),
    );
    return () => cancelAnimation(angle);
  }, [angle, moving]);

  // A small satellite riding the tilted orbit; it hides while passing behind the photo.
  const satellite = useAnimatedStyle(() => {
    const t = angle.get();
    const x = ORBIT_RADIUS * Math.cos(t);
    const y = ORBIT_RADIUS * ORBIT_SQUASH * Math.sin(t);
    const screenX = x * Math.cos(tilt) - y * Math.sin(tilt);
    const screenY = x * Math.sin(tilt) + y * Math.cos(tilt);
    const behind = Math.sin(t) < 0 && Math.hypot(screenX, screenY) < PHOTO / 2;
    return {
      opacity: behind ? 0 : 1,
      transform: [{ translateX: screenX }, { translateY: screenY }],
    };
  });

  return (
    <View className="h-[150px] w-[200px] items-center justify-center">
      <View
        pointerEvents="none"
        className="absolute h-[180px] w-[180px] -rotate-[16deg] scale-y-[0.39] rounded-full border border-accent/40"
      />
      <View
        pointerEvents="none"
        className="absolute h-[150px] w-[150px] rotate-[22deg] scale-y-[0.37] rounded-full border border-cyan/25"
      />
      <View
        accessibilityRole="image"
        accessibilityLabel="Profile avatar"
        className="h-[108px] w-[108px] items-center justify-center rounded-full border-2 border-line bg-surface"
      >
        {helmetReady ? null : (
          <Text className="font-display text-4xl text-ink">{initials}</Text>
        )}
      </View>
      <View pointerEvents="none" className="absolute">
        <HelmetAvatar size={HELMET} still={!moving} onReady={showHelmet} />
      </View>
      <Animated.View
        pointerEvents="none"
        className="absolute h-2 w-2 rounded-full bg-accent"
        style={satellite}
      />
      <View className="absolute bottom-0 right-7">
        <IconButton
          icon="camera"
          label="Change photo"
          onPress={onChangePhoto}
        />
      </View>
    </View>
  );
}
