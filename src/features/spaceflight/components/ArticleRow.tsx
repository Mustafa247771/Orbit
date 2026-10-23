import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import colors from "@/theme/colors";
import type { ArticleView } from "../viewmodels/useSpaceflightViewModel";

type ArticleRowProps = {
  article: ArticleView;
  saved: boolean;
  last: boolean;
  onOpen: () => void;
  onToggleSaved: () => void;
};

export function ArticleRow({
  article,
  saved,
  last,
  onOpen,
  onToggleSaved,
}: ArticleRowProps) {
  return (
    <View
      className={`flex-row items-start gap-2 py-3.5 ${last ? "" : "border-b border-line"}`}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="link"
        accessibilityLabel={`${article.title}. ${article.meta}`}
        className="flex-1 flex-row gap-3.5 active:opacity-70"
      >
        <View className="h-[84px] w-[84px] overflow-hidden rounded-2xl border border-line bg-surface">
          {article.imageUrl ? (
            <Image
              source={{ uri: article.imageUrl }}
              contentFit="cover"
              transition={300}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
        <View className="flex-1 gap-1.5">
          <Text
            numberOfLines={1}
            className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted"
          >
            {article.meta}
          </Text>
          <Text
            numberOfLines={3}
            className="text-[15px] font-semibold leading-[21px] text-ink"
          >
            {article.title}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onToggleSaved();
        }}
        accessibilityRole="button"
        accessibilityLabel={saved ? "Remove from saved" : "Save article"}
        accessibilityState={{ selected: saved }}
        className="-mr-2.5 -mt-2.5 h-11 w-11 items-center justify-center active:opacity-60"
      >
        <Icon
          name={saved ? "bookmarkFilled" : "bookmark"}
          color={saved ? colors.cyan : colors.muted}
        />
      </Pressable>
    </View>
  );
}
