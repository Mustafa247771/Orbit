import * as Haptics from "expo-haptics";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/Icon";

type MenuButtonProps = {
  open: boolean;
  hidden: boolean;
  onPress: () => void;
};

export function MenuButton({ open, hidden, onPress }: MenuButtonProps) {
  const fade = useAnimatedStyle(() => ({
    opacity: withTiming(hidden ? 0 : 1, { duration: hidden ? 200 : 300 }),
  }));

  return (
    <SafeAreaView
      edges={["bottom"]}
      pointerEvents={hidden ? "none" : "box-none"}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
      className="absolute inset-x-0 bottom-0 items-center"
    >
      <Animated.View style={fade}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onPress();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={open ? "Back to Earth" : "Open menu"}
          accessibilityState={{ expanded: open }}
          className="mb-6 h-16 w-16 items-center justify-center rounded-full border border-line bg-surface/80 active:opacity-60"
        >
          <Icon name={open ? "globe" : "menu"} size={24} />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}
