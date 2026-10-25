import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import colors from "@/theme/colors";
import type { ArticleView } from "../viewmodels/useSpaceflightViewModel";

type FeaturedArticleProps = {
  article: ArticleView;
  onOpen: () => void;
};

export function FeaturedArticle({ article, onOpen }: FeaturedArticleProps) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="link"
      accessibilityLabel={`${article.title}. ${article.meta}`}
      className="mx-5 mt-5 overflow-hidden rounded-[28px] border border-line bg-surface/80 active:opacity-80"
    >
      <View className="h-52 bg-space">
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            contentFit="cover"
            transition={300}
            className="flex-1"
          />
        ) : null}
        <View className="absolute left-3.5 top-3.5">
          <Tag label="Featured" tone="cyan" />
        </View>
      </View>
      <View className="gap-2.5 p-[18px]">
        <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
          {article.meta}
        </Text>
        <Text
          numberOfLines={3}
          className="font-display text-[22px] leading-[27px] text-ink"
        >
          {article.title}
        </Text>
        <Text numberOfLines={3} className="text-sm leading-[21px] text-muted">
          {article.summary}
        </Text>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
            Read on {article.site}
          </Text>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-cyan">
            <Icon name="open" color={colors.space} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
