import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import colors from "@/theme/colors";
import type { SpacePicture } from "../model/SpacePicture";

const STACK = [
  { left: 0, rotate: "-8deg" },
  { left: 22, rotate: "0deg" },
  { left: 44, rotate: "8deg" },
];

type CollectionCardProps = {
  saved: readonly SpacePicture[];
  onPress: () => void;
};

export function CollectionCard({ saved, onPress }: CollectionCardProps) {
  const covers = saved.slice(0, STACK.length);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mx-5 mt-8 flex-row items-center gap-4 rounded-3xl border border-line bg-surface/80 p-4 active:opacity-70"
    >
      <View className="h-20 w-24">
        {covers.length === 0 ? (
          <View className="h-20 w-16 items-center justify-center rounded-xl border border-dashed border-line">
            <Icon name="star" color={colors.muted} />
          </View>
        ) : (
          covers.map((picture, index) => (
            <View
              key={picture.id}
              className="absolute top-1 h-[72px] w-14 overflow-hidden rounded-xl border border-line bg-surface"
              style={{
                left: STACK[index].left,
                transform: [{ rotate: STACK[index].rotate }],
              }}
            >
              <Image
                source={{ uri: picture.thumbnailUrl }}
                contentFit="cover"
                style={{ flex: 1 }}
              />
            </View>
          ))
        )}
      </View>
      <View className="flex-1 gap-1.5">
        <Text className="font-display text-[19px] text-ink">
          Your collection
        </Text>
        <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
          {saved.length === 0
            ? "Double-tap a picture to save it"
            : `${saved.length} saved`}
        </Text>
      </View>
      <Icon name="chevron" color={colors.muted} />
    </Pressable>
  );
}
