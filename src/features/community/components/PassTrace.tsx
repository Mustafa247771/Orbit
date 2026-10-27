import { useState } from "react";
import { Text, View } from "react-native";

import { Label } from "@/components/ui/Label";
import type { PassTraceData } from "../model/Post";

const BASELINE = 76; // keep in sync with top-[76px] and top-[80px] below
const PAD = 16;
const DOTS = 25;
const PEAK = (DOTS - 1) / 2;
const MAX_RISE = 60;

/** The pass as a dotted arc over the horizon, as high as its maximum elevation. */
export function PassTrace({ maxElevation, rises, sets }: PassTraceData) {
  const [width, setWidth] = useState(0);
  const rise = (maxElevation / 90) * MAX_RISE;
  const span = width - PAD * 2;

  const dots = width
    ? Array.from({ length: DOTS }, (_, index) => {
        const t = index / (DOTS - 1);
        return { x: PAD + span * t, y: BASELINE - rise * 4 * t * (1 - t) };
      })
    : [];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Pass rising in the ${rises}, peaking at ${maxElevation} degrees and setting in the ${sets}`}
      className="rounded-2xl border border-line bg-space/60 px-3.5 pb-2 pt-3"
    >
      <View className="flex-row justify-between">
        <Label>Pass trace</Label>
        <Label tone="cyan">Max {maxElevation}°</Label>
      </View>
      <View
        className="h-[96px]"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View className="absolute inset-x-0 top-[76px] h-px bg-line" />
        {dots.map((dot, index) => {
          const size = index === PEAK ? 8 : 3;
          return (
            <View
              key={index}
              className={`absolute rounded-full bg-cyan ${index === PEAK ? "h-2 w-2" : "h-[3px] w-[3px] opacity-[0.55]"}`}
              style={{ left: dot.x - size / 2, top: dot.y - size / 2 }}
            />
          );
        })}
        <Text className="absolute left-0 top-[80px] font-mono text-[11px] text-muted">
          {rises}
        </Text>
        <Text className="absolute right-0 top-[80px] font-mono text-[11px] text-muted">
          {sets}
        </Text>
      </View>
    </View>
  );
}
