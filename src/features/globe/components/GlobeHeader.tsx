import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const utcClock = () => new Date().toISOString().slice(11, 16);

type GlobeHeaderProps = {
  menuOpen: boolean;
  trackedCount: number;
};

export function GlobeHeader({ menuOpen, trackedCount }: GlobeHeaderProps) {
  const [time, setTime] = useState(utcClock);

  useEffect(() => {
    const timer = setInterval(() => setTime(utcClock()), 1000);
    return () => clearInterval(timer);
  }, []);

  const title = menuOpen ? "Star chart" : "Earth";

  return (
    <SafeAreaView
      edges={["top"]}
      pointerEvents="none"
      className="absolute inset-x-0 top-0"
    >
      <Animated.View key={title} entering={FadeIn.duration(300)}>
        <View className="px-5 pt-2">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-display text-[34px] text-ink">{title}</Text>
            <Text className="text-[15px] text-muted">{time} UTC</Text>
          </View>
          <Text className="mt-0.5 text-[15px] text-muted">
            {menuOpen
              ? "Each star opens a screen"
              : `${trackedCount} satellites tracked live`}
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
