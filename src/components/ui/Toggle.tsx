import * as Haptics from "expo-haptics";
import { Pressable } from "react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";

import colors from "@/theme/colors";

const KNOB = 24;
const TRAVEL = 20;
const DURATION_MS = 180;

type ToggleProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function Toggle({ label, value, onChange }: ToggleProps) {
  const knob = useAnimatedStyle(() => ({
    backgroundColor: withTiming(value ? colors.accent : colors.muted, {
      duration: DURATION_MS,
    }),
    transform: [
      { translateX: withTiming(value ? TRAVEL : 0, { duration: DURATION_MS }) },
    ],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onChange(!value);
      }}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      className={`h-8 w-[52px] justify-center rounded-full border px-[3px] ${value ? "border-accent/60 bg-accent/20" : "border-line bg-space/60"}`}
    >
      <Animated.View
        style={[{ width: KNOB, height: KNOB, borderRadius: KNOB / 2 }, knob]}
      />
    </Pressable>
  );
}
