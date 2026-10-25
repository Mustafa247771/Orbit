import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScrambleText } from "@/components/ui/ScrambleText";
import { Stat } from "@/components/ui/Stat";

import type {
  SatelliteDetailsView,
  SatelliteFamily,
} from "../viewmodels/useEarthViewModel";

const FAMILY_LABELS: Record<SatelliteFamily, string> = {
  iss: "Space station",
  starlink: "Starlink",
  generic: "Satellite",
};

type SatelliteDetailsSheetProps = {
  details: SatelliteDetailsView;
  family: SatelliteFamily;
  onClose: () => void;
};

export function SatelliteDetailsSheet({
  details,
  family,
  onClose,
}: SatelliteDetailsSheetProps) {
  const stats = [
    { label: "Altitude", value: details.altitude },
    { label: "Speed", value: details.speed },
    { label: "Latitude", value: details.latitude },
    { label: "Longitude", value: details.longitude },
    { label: "Orbit period", value: details.period },
  ];

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      exiting={FadeOutDown.duration(250)}
      className="absolute inset-x-4 bottom-0"
    >
      <SafeAreaView edges={["bottom"]} className="pb-4">
        <View className="rounded-3xl border border-line bg-surface/90 p-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <View className="h-1.5 w-1.5 rounded-full bg-accent" />
                <Text className="text-[10px] uppercase tracking-[3px] text-accent">
                  Locked on
                </Text>
              </View>
              <ScrambleText
                text={details.name.toUpperCase()}
                className="mt-2 text-2xl font-light tracking-[4px] text-ink"
              />
              <Text className="mt-1 text-xs uppercase tracking-[2px] text-muted">
                NORAD {details.noradId} · {FAMILY_LABELS[family]}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close details"
              className="h-10 w-10 items-center justify-center rounded-full border border-line active:opacity-60"
            >
              <Text className="text-base text-ink">✕</Text>
            </Pressable>
          </View>

          <View className="my-4 h-px bg-line" />

          <View className="flex-row flex-wrap">
            {stats.map((stat, i) => (
              <Animated.View
                key={stat.label}
                entering={FadeInDown.delay(250 + i * 70).duration(350)}
                className="w-1/2"
              >
                <Stat label={stat.label} value={stat.value} />
              </Animated.View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}
