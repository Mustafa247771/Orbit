import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconButton } from "@/components/ui/IconButton";
import type { BadgeView } from "../viewmodels/useAchievementsViewModel";
import { MedalCanvas } from "./MedalCanvas";

const STATE_TEXT = {
  earned: "text-accent",
  progress: "text-cyan",
  locked: "text-muted",
};

type BadgeSheetProps = {
  badge: BadgeView | null;
  onClose: () => void;
  onShare: (badge: BadgeView) => void;
};

export function BadgeSheet({ badge, onClose, onShare }: BadgeSheetProps) {
  return (
    <Modal
      visible={badge !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          onPress={onClose}
          accessibilityLabel="Close badge"
          className="absolute inset-0 bg-black/60"
        />
        {badge ? (
          <SafeAreaView
            edges={["bottom"]}
            className="rounded-t-[32px] border-t border-line bg-surface px-5 pb-4 pt-3"
          >
            <View className="h-1.5 w-10 self-center rounded-full bg-line" />
            <View className="absolute right-4 top-4 z-10">
              <IconButton icon="close" label="Close badge" onPress={onClose} />
            </View>

            <MedalCanvas tier={badge.tier} locked={badge.state !== "earned"} />

            <View className="items-center gap-2">
              <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
                Drag to spin
              </Text>
              <Text
                className={`font-mono text-[11px] uppercase tracking-[1.5px] ${STATE_TEXT[badge.state]}`}
              >
                {badge.stateLabel}
              </Text>
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
                  <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
                    {stat.label}
                  </Text>
                  <Text className="font-display text-xl text-ink">
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>

            {badge.state === "earned" ? (
              <Pressable
                onPress={() => onShare(badge)}
                accessibilityRole="button"
                className="mt-5 h-[52px] items-center justify-center rounded-full bg-gold active:opacity-80"
              >
                <Text className="text-[15px] font-semibold text-space">
                  Share badge
                </Text>
              </Pressable>
            ) : null}
          </SafeAreaView>
        ) : null}
      </View>
    </Modal>
  );
}
