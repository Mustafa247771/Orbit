import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import colors from "@/theme/colors";
import type { SpacePicture } from "../model/SpacePicture";

function ArchiveImage({
  photo,
  wide = false,
}: {
  photo: SpacePicture;
  wide?: boolean;
}) {
  return (
    <View className={wide ? "w-full" : "flex-1"}>
      <View
        className={
          wide
            ? "h-[180px] overflow-hidden rounded"
            : "h-[155px] overflow-hidden rounded"
        }
      >
        <Image
          source={{ uri: photo.thumbnailUrl }}
          contentFit="cover"
          accessibilityLabel={photo.title}
          className="h-full w-full"
        />
      </View>

      <View className="mt-2.5 flex-row items-center justify-between gap-1">
        <Text numberOfLines={1} className="flex-1 text-[10px] text-pale">
          {photo.title}
        </Text>
        <Text className="text-[9px] text-mist">{photo.year}</Text>
      </View>
    </View>
  );
}

type ApodDetailsProps = {
  picture: SpacePicture;
  archive: readonly SpacePicture[];
};

export function ApodDetails({ picture, archive }: ApodDetailsProps) {
  return (
    <>
      <View className="mx-6 mt-8 border-y border-edge-dim px-3 py-7">
        <View className="flex-row items-center gap-2">
          <Text className="text-[13px] text-haze">✦</Text>
          <Text className="text-[11px] text-haze">Inside the image</Text>
        </View>

        <Text
          accessibilityRole="header"
          className="mt-4 font-display text-[29px] leading-[33px] tracking-[-1px] text-ink"
        >
          About this picture
        </Text>
        <Text className="mt-4 text-[13px] leading-[24px] text-haze">
          {picture.description ||
            "NASA has not supplied a description for this image."}
        </Text>

        <Pressable
          disabled
          className="mt-3 min-h-[44px] flex-row items-center gap-3"
        >
          <Text className="text-[12px] text-cyan">Read the full story</Text>
          <Text className="text-[19px] text-cyan">→</Text>
        </Pressable>

        <View className="mt-4 flex-row justify-between">
          <Text className="flex-1 text-[9px] text-dusk">{picture.credit}</Text>
          <Text className="text-[9px] text-dusk">{picture.year}</Text>
        </View>
      </View>

      <View className="mt-8 px-6">
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] text-haze">Keep exploring</Text>
            <Text
              accessibilityRole="header"
              className="mt-1 font-display text-[30px] tracking-[-1px] text-ink"
            >
              The archive.
            </Text>
          </View>

          <Pressable
            disabled
            accessibilityLabel="View archive"
            className="h-[44px] w-[44px] items-center justify-center rounded-full border border-edge"
          >
            <Text className="text-[22px] text-pale">→</Text>
          </Pressable>
        </View>

        {archive[0] && <ArchiveImage photo={archive[0]} wide />}

        <View className="mt-5 flex-row gap-3">
          {archive.slice(1, 3).map((photo) => (
            <ArchiveImage key={photo.id} photo={photo} />
          ))}
        </View>

        <View className="mt-8 flex-row items-center gap-4 border-y border-edge-dim py-6">
          <Icon name="bookmark" size={23} color={colors.gold} />
          <View className="flex-1">
            <Text className="font-display text-[13px] text-ink">
              Your saved discoveries
            </Text>
            <Text className="mt-1 text-[10px] text-muted">
              A small universe of your own.
            </Text>
          </View>
          <Icon name="chevron" size={17} color={colors.mist} />
        </View>

        <View className="mt-7 flex-row items-center justify-center gap-3">
          <Text className="text-[9px] text-dusk">NASA imagery</Text>
          <Text className="text-[10px] text-dusk">✦</Text>
          <Text className="text-[9px] text-dusk">Explored with Orbit</Text>
        </View>
      </View>
    </>
  );
}
