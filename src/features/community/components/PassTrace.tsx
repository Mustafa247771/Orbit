import { useState } from "react";
import { Text, View } from "react-native";

import colors from "@/theme/colors";
import type { PassTraceData } from "../model/Post";

const HEIGHT = 96;
const BASELINE = 76;
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
        <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
          Pass trace
        </Text>
        <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-cyan">
          Max {maxElevation}°
        </Text>
      </View>
      <View
        style={{ height: HEIGHT }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View
          className="absolute h-px bg-line"
          style={{ left: 0, right: 0, top: BASELINE }}
        />
        {dots.map((dot, index) => {
          const size = index === PEAK ? 8 : 3;
          return (
            <View
              key={index}
              style={{
                position: "absolute",
                left: dot.x - size / 2,
                top: dot.y - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.cyan,
                opacity: index === PEAK ? 1 : 0.55,
              }}
            />
          );
        })}
        <Text
          className="absolute left-0 font-mono text-[11px] text-muted"
          style={{ top: BASELINE + 4 }}
        >
          {rises}
        </Text>
        <Text
          className="absolute right-0 font-mono text-[11px] text-muted"
          style={{ top: BASELINE + 4 }}
        >
          {sets}
        </Text>
      </View>
    </View>
  );
}
