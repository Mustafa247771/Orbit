import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Stat } from "@/components/ui/Stat";
import { Label } from "@/components/ui/Label";
import colors from "@/theme/colors";
import type { Rank } from "../model/Achievement";

type RankCardProps = {
  rank: Rank;
  progress: number;
  stats: { label: string; value: string }[];
};

const grouped = (value: number) => value.toLocaleString("en-US");

export function RankCard({ rank, progress, stats }: RankCardProps) {
  return (
    <Card className="mx-5 mt-6 gap-4 p-5">
      <View className="flex-row items-center gap-5">
        <ProgressRing
          size={112}
          stroke={8}
          progress={progress}
          color={colors.gold}
        >
          <Label tone="gold">Level</Label>
          <Text className="font-display text-[38px] leading-[40px] text-ink">
            {rank.level}
          </Text>
        </ProgressRing>
        <View className="flex-1 gap-1.5">
          <Label tone="gold">Current rank</Label>
          <Text className="font-display text-[28px] leading-[30px] text-ink">
            {rank.title}
          </Text>
          <Label>{grouped(rank.xp)} / {grouped(rank.nextXp)} XP</Label>
          <Text className="text-[13px] leading-[18px] text-muted">
            {grouped(rank.nextXp - rank.xp)} XP to {rank.nextTitle}
          </Text>
        </View>
      </View>
      <View className="h-px bg-line" />
      <View className="flex-row">
        {stats.map((stat) => (
          <View key={stat.label} className="flex-1">
            <Stat label={stat.label} value={stat.value} />
          </View>
        ))}
      </View>
    </Card>
  );
}
