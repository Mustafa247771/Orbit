import { Text, View } from "react-native";

import { Label } from "@/components/ui/Label";
import { Tag } from "@/components/ui/Tag";
import type { Pass } from "../model/Pass";

type PassRowProps = {
  pass: Pass;
  last: boolean;
};

/** One upcoming pass: when, which way across the sky, and how good. */
export function PassRow({ pass, last }: PassRowProps) {
  return (
    <View
      className={`flex-row gap-3.5 py-3.5 ${last ? "" : "border-b border-line"}`}
    >
      <View className="h-[72px] w-[84px] items-center justify-center gap-1 rounded-2xl border border-line bg-surface">
        <Label tone="cyan">{pass.day}</Label>
        <Text className="text-[15px] font-semibold text-ink">{pass.time}</Text>
      </View>

      <View className="flex-1 justify-center gap-1.5">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-[15px] font-semibold leading-[21px] text-ink">
            {pass.direction}
          </Text>
          <Tag
            label={pass.quality}
            tone={pass.quality === "Good" ? "accent" : "gold"}
          />
        </View>
        <Text className="text-[13px] text-muted">
          {pass.duration} visible · {pass.elevation} elevation
        </Text>
      </View>
    </View>
  );
}
