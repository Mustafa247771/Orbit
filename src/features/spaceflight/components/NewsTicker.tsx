import { Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  useReducedMotion,
} from "react-native-reanimated";

import { Label } from "@/components/ui/Label";

type NewsTickerProps = {
  headline: string;
  tick: number;
};

export function NewsTicker({ headline, tick }: NewsTickerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <View className="mx-5 mt-5 h-11 flex-row items-center overflow-hidden rounded-2xl border border-line bg-surface/80">
      <View className="h-full flex-row items-center gap-2 border-r border-line px-3">
        <View className="h-2 w-2 rounded-full bg-accent" />
        <Label tone="accent">Latest</Label>
      </View>
      <View className="h-full flex-1 justify-center">
        <Animated.View
          key={tick}
          entering={reduceMotion ? undefined : FadeInDown.duration(300)}
          exiting={reduceMotion ? undefined : FadeOutUp.duration(200)}
          className="absolute inset-x-3"
        >
          <Text numberOfLines={1} className="text-[13px] text-ink">
            {headline}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
