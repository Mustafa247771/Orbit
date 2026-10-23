import { Image } from "expo-image";
import { Pressable, ScrollView, Text, View } from "react-native";

import type { SpacePicture } from "../model/SpacePicture";

type ArchiveStripProps = {
  pictures: readonly SpacePicture[];
  onSelect: (id: string) => void;
};

export function ArchiveStrip({ pictures, onSelect }: ArchiveStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
    >
      {pictures.map((picture) => (
        <Pressable
          key={picture.id}
          onPress={() => onSelect(picture.id)}
          accessibilityRole="button"
          accessibilityLabel={`Show ${picture.title}`}
          className="w-28 gap-2 active:opacity-70"
        >
          <View className="h-36 w-28 overflow-hidden rounded-2xl border border-line bg-surface">
            <Image
              source={{ uri: picture.thumbnailUrl }}
              contentFit="cover"
              transition={300}
              style={{ flex: 1 }}
            />
          </View>
          <Text
            numberOfLines={2}
            className="text-[13px] leading-[17px] text-ink"
          >
            {picture.title}
          </Text>
          <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
            {picture.year}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
