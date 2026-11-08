import { useEffect, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const utcClock = () => new Date().toISOString().slice(11, 16);

type GlobeHeaderProps = {
  menuOpen: boolean;
  trackedCount: number;
  objectCount: number;
  children?: ReactNode;
  satelliteStatus: string;
  satelliteError: string | null;
  refreshing: boolean;
  onRetry: () => void;
};

export function GlobeHeader({
  menuOpen,
  trackedCount,
  objectCount,
  children,
  satelliteStatus,
  satelliteError,
  refreshing,
  onRetry,
}: GlobeHeaderProps) {
  const [time, setTime] = useState(utcClock);

  useEffect(() => {
    const timer = setInterval(() => setTime(utcClock()), 1000);

    return () => clearInterval(timer);
  }, []);

  const title = menuOpen ? "Star chart" : "Earth";

  return (
    <SafeAreaView
      edges={["top"]}
      pointerEvents="box-none"
      className="absolute inset-x-0 top-0"
    >
      <Animated.View
        key={title}
        entering={FadeIn.duration(300)}
        pointerEvents="box-none"
      >
        <View className="px-5 pt-2" pointerEvents="box-none">
          <View pointerEvents="none">
            <View className="flex-row items-baseline justify-between">
              <Text className="font-display text-[34px] text-ink">{title}</Text>
              <Text className="text-[15px] text-muted">{time} UTC</Text>
            </View>

            <Text className="mt-0.5 text-[15px] text-muted">
              {menuOpen
                ? "Each star opens a screen"
                : `${objectCount} objects shown · ${trackedCount} tracked`}
            </Text>

            {!menuOpen && (
              <Text className="mt-1 text-xs text-muted">{satelliteStatus}</Text>
            )}
          </View>

          {!menuOpen && children}

          {!menuOpen && satelliteError && (
            <View className="mt-2 rounded-2xl border border-gold/30 bg-space/90 px-3 py-2">
              <Text
                accessibilityRole="alert"
                className="text-xs leading-5 text-gold"
              >
                {satelliteError}
                {trackedCount > 0 ? " Showing available orbital data." : ""}
              </Text>

              <Pressable
                onPress={onRetry}
                disabled={refreshing}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: refreshing,
                  busy: refreshing,
                }}
                className="min-h-11 justify-center self-start active:opacity-60"
              >
                <Text className="text-sm font-semibold text-cyan">
                  {refreshing ? "Updating…" : "Try again"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
