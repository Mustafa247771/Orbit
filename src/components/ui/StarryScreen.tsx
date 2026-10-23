import {
  useRef,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import {
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type RefreshControlProps,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InteractiveStarField, type StarPointer } from "./InteractiveStarField";

type StarryScreenProps = {
  children: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
  edgeToEdge?: boolean;
  scrollY?: SharedValue<number>;
  scrollRef?: RefObject<Animated.ScrollView | null>;
  overlay?: ReactNode;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function StarryScreen({
  children,
  refreshControl,
  edgeToEdge = false,
  scrollY,
  scrollRef,
  overlay,
}: StarryScreenProps) {
  const insets = useSafeAreaInsets();
  const pointer = useRef<StarPointer>({ active: false, x: 0.5, y: 0.5 });
  const size = useRef({ width: 1, height: 1 });

  const track = ({ nativeEvent }: GestureResponderEvent) => {
    pointer.current = {
      active: true,
      x: clamp(nativeEvent.pageX / size.current.width),
      y: clamp(nativeEvent.pageY / size.current.height),
    };
  };
  const release = () => {
    pointer.current.active = false;
  };
  const measure = ({ nativeEvent }: LayoutChangeEvent) => {
    size.current = nativeEvent.layout;
  };

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY?.set(event.contentOffset.y);
  });

  return (
    <View
      className="flex-1 bg-space"
      onLayout={measure}
      onTouchStart={track}
      onTouchMove={track}
      onTouchEnd={release}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <InteractiveStarField pointer={pointer} />
      </View>
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: edgeToEdge ? 0 : insets.top,
          paddingBottom: insets.bottom + 120,
        }}
      >
        {children}
      </Animated.ScrollView>
      {overlay}
    </View>
  );
}
