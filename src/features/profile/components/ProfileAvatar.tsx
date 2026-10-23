import { IconButton } from "@/components/ui/IconButton";
import colors from "@/theme/colors";
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

const PHOTO = 108;
const HELMET = 150;
const ORBIT_RADIUS = 90;
const ORBIT_SQUASH = 0.39;
const ORBIT_TILT_DEG = -16;
const LAP_MS = 14_000;
const DOT = 8;

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
        className="absolute h-[180px] w-[180px] rounded-full border border-accent/40"
        style={{
          transform: [
            { rotate: `${ORBIT_TILT_DEG}deg` },
            { scaleY: ORBIT_SQUASH },
          ],
        }}
      />
      <View
        pointerEvents="none"
        className="absolute h-[150px] w-[150px] rounded-full border border-cyan/25"
        style={{ transform: [{ rotate: "22deg" }, { scaleY: 0.37 }] }}
      />
      <View
        accessibilityRole="image"
        accessibilityLabel="Profile avatar"
        className="items-center justify-center rounded-full border-2 border-line bg-surface"
        style={{ width: PHOTO, height: PHOTO }}
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
        style={[
          {
            position: "absolute",
            width: DOT,
            height: DOT,
            borderRadius: DOT / 2,
            backgroundColor: colors.accent,
          },
          satellite,
        ]}
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
