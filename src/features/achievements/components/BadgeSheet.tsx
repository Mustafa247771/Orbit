import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Label, type LabelTone } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import type { BadgeView } from "../viewmodels/useAchievementsViewModel";
import { MedalCanvas } from "./MedalCanvas";

const STATE_TONE: Record<BadgeView["state"], LabelTone> = {
  earned: "accent",
  progress: "cyan",
  locked: "muted",
};

type BadgeSheetProps = {
  badge: BadgeView | null;
  onClose: () => void;
  onShare: (badge: BadgeView) => void;
};

export function BadgeSheet({ badge, onClose, onShare }: BadgeSheetProps) {
  return (
    <Sheet visible={badge !== null} onClose={onClose} closeLabel="Close badge">
      {badge ? (
        <>
          <MedalCanvas tier={badge.tier} locked={badge.state !== "earned"} />

          <View className="items-center gap-2">
            <Label>Drag to spin</Label>
            <Label tone={STATE_TONE[badge.state]}>{badge.stateLabel}</Label>
            <Text className="text-center font-display text-[32px] leading-9 text-ink">
              {badge.title}
            </Text>
            <Text className="max-w-[300px] text-center text-[15px] leading-[22px] text-muted">
              {badge.description}
            </Text>
          </View>

          <View className="mt-5 flex-row gap-2.5">
            {[
              { label: "Rarity", value: `${badge.rarity}%` },
              { label: "Reward", value: `+${badge.xp} XP` },
              {
                label: "Tier",
                value: badge.tier === "gold" ? "Gold" : "Silver",
              },
            ].map((stat) => (
              <View
                key={stat.label}
                className="flex-1 gap-1 rounded-2xl border border-line bg-space/50 p-3"
              >
                <Label>{stat.label}</Label>
                <Text className="font-display text-xl text-ink">
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>

          {badge.state === "earned" ? (
            <Button
              label="Share badge"
              tone="gold"
              size="lg"
              onPress={() => onShare(badge)}
              className="mt-5"
            />
          ) : null}
        </>
      ) : null}
    </Sheet>
  );
}
