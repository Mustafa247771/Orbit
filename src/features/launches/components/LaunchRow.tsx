import { Text, View } from "react-native";

import { Label } from "@/components/ui/Label";
import { Tag } from "@/components/ui/Tag";
import type { LaunchView } from "../viewmodels/useLaunchesViewModel";

type LaunchRowProps = {
  launch: LaunchView;
  last: boolean;
};

/** One upcoming launch: date block, name, pad and time left. */
export function LaunchRow({ launch, last }: LaunchRowProps) {
  return (
    <View
      className={`flex-row gap-3.5 py-3.5 ${last ? "" : "border-b border-line"}`}
    >
      <View className="h-[84px] w-[72px] items-center justify-center rounded-2xl border border-line bg-surface">
        <Label tone="cyan">{launch.month}</Label>
        <Text className="font-display text-[26px] text-ink">{launch.day}</Text>
        <Text className="text-xs text-muted">{launch.time}</Text>
      </View>

      <View className="flex-1 gap-1.5">
        <View className="flex-row items-center gap-2">
          <Label numberOfLines={1} className="flex-1">
            {launch.provider}
          </Label>
          <Tag label={launch.statusAbbreviation} tone="accent" />
        </View>
        <Text
          numberOfLines={2}
          className="text-[15px] font-semibold leading-[21px] text-ink"
        >
          {launch.name}
        </Text>
        <Text numberOfLines={1} className="text-[13px] text-muted">
          {launch.location}
        </Text>
        <Label tone="cyan">{launch.tMinus}</Label>
      </View>
    </View>
  );
}
