import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import colors from "@/theme/colors";
import type { BadgeView } from "../viewmodels/useAchievementsViewModel";

type ProgressListProps = {
  badges: BadgeView[];
  onSelect: (id: string) => void;
};

export function ProgressList({ badges, onSelect }: ProgressListProps) {
  if (badges.length === 0) return null;

  return (
    <View className="mx-5 mt-8">
      <SectionLabel title="Almost there" />
      <View className="gap-3">
        {badges.map((badge) => (
          <Pressable
            key={badge.id}
            onPress={() => onSelect(badge.id)}
            accessibilityRole="button"
            accessibilityLabel={`${badge.title}, ${badge.stateLabel}`}
            className="active:opacity-70"
          >
            <Card className="flex-row items-center gap-3.5 p-4">
              <View className="h-11 w-11 items-center justify-center rounded-full border border-cyan/40">
                <Icon name={badge.icon} color={colors.cyan} />
              </View>
              <View className="flex-1 gap-1.5">
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-[15px] font-semibold text-ink">
                    {badge.title}
                  </Text>
                  <Text className="font-mono text-[11px] text-cyan">
                    {badge.progress} / {badge.goal}
                  </Text>
                </View>
                <Text className="text-[13px] leading-[18px] text-muted">
                  {badge.description}
                </Text>
                <View className="h-1.5 overflow-hidden rounded-full bg-line">
                  <View
                    className="h-full rounded-full bg-cyan"
                    style={{ width: `${badge.percent * 100}%` }}
                  />
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
