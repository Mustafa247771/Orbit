import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import colors from "@/theme/colors";
import type { Observer } from "../model/Post";

type ObserverRowProps = {
  observers: readonly Observer[];
  more: number;
  onAddSighting: () => void;
};

export function ObserverRow({
  observers,
  more,
  onAddSighting,
}: ObserverRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}
    >
      <Pressable
        onPress={onAddSighting}
        accessibilityRole="button"
        accessibilityLabel="Log a sighting"
        className="w-[60px] items-center gap-2 active:opacity-60"
      >
        <View className="h-14 w-14 items-center justify-center rounded-full border border-dashed border-accent/60">
          <Icon name="add" color={colors.accent} />
        </View>
        <Text className="text-xs text-muted">You</Text>
      </Pressable>
      {observers.map((observer) => (
        <View key={observer.id} className="w-[60px] items-center gap-2">
          <Avatar
            initials={observer.initials}
            size={56}
            online={observer.online}
          />
          <Text numberOfLines={1} className="text-xs text-ink/80">
            {observer.name}
          </Text>
        </View>
      ))}
      <View className="w-[60px] items-center gap-2">
        <View className="h-14 w-14 items-center justify-center rounded-full border border-line bg-surface/80">
          <Text className="font-mono text-xs text-ink/80">+{more}</Text>
        </View>
        <Text className="text-xs text-muted">More</Text>
      </View>
    </ScrollView>
  );
}
