import { Image } from "expo-image";
import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Countdown } from "@/components/ui/Countdown";
import { Label } from "@/components/ui/Label";
import { StatRow } from "@/components/ui/StatRow";
import { Tag } from "@/components/ui/Tag";
import type { LaunchView } from "../viewmodels/useLaunchesViewModel";

type FeaturedLaunchProps = {
  launch: LaunchView;
};

/** The next launch: photo, name, live countdown and target time. */
export function FeaturedLaunch({ launch }: FeaturedLaunchProps) {
  return (
    <Card className="mx-5 mt-5">
      <View className="h-52 bg-space">
        {launch.imageUrl ? (
          <Image
            source={{ uri: launch.imageUrl }}
            contentFit="cover"
            transition={300}
            className="flex-1"
          />
        ) : null}
        <View className="absolute left-3.5 top-3.5">
          <Tag dot label={launch.status} tone="cyan" />
        </View>
      </View>

      <View className="gap-2.5 p-[18px]">
        <Label numberOfLines={1}>Next launch · {launch.provider}</Label>
        <Text
          numberOfLines={3}
          className="font-display text-[22px] leading-[27px] text-ink"
        >
          {launch.name}
        </Text>
        <Text className="text-sm leading-[21px] text-muted">
          {launch.rocket} · {launch.location}
        </Text>
        <View className="my-3">
          <Countdown seconds={launch.secondsLeft} showDays />
        </View>
        <View className="border-t border-line pt-2">
          <StatRow
            stats={[
              { label: "Target time", value: launch.target },
              { label: "Mission", value: launch.missionType },
            ]}
          />
        </View>
      </View>
    </Card>
  );
}
