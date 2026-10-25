import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import colors from "@/theme/colors";
import type { PostView } from "../viewmodels/useCommunityViewModel";
import { PassTrace } from "./PassTrace";

type StarButtonProps = {
  active: boolean;
  count: number;
  onPress: () => void;
};

function StarButton({ active, count, onPress }: StarButtonProps) {
  const pop = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        if (!active)
          pop.set(
            withSequence(withTiming(1.35, { duration: 120 }), withSpring(1)),
          );
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${active ? "Starred" : "Star"}, ${count} stars`}
      accessibilityState={{ selected: active }}
      className="h-11 flex-row items-center gap-1.5 px-2.5 active:opacity-60"
    >
      <Animated.View style={style}>
        <Icon
          name={active ? "starFilled" : "star"}
          color={active ? colors.gold : colors.muted}
        />
      </Animated.View>
      <Text
        className={`text-sm font-semibold ${active ? "text-gold" : "text-ink/80"}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {count}
      </Text>
    </Pressable>
  );
}

type PostCardProps = {
  post: PostView;
  onToggleStar: () => void;
  onToggleSeen: () => void;
  onOpenComments: () => void;
  onShare: () => void;
};

export function PostCard({
  post,
  onToggleStar,
  onToggleSeen,
  onOpenComments,
  onShare,
}: PostCardProps) {
  return (
    <Card>
      <View className="flex-row items-center gap-3 px-4 py-3.5">
        <Avatar initials={post.author.initials} />
        <View className="flex-1 gap-0.5">
          <Text className="text-[15px] font-semibold text-ink">
            {post.author.name}
          </Text>
          <Text
            numberOfLines={1}
            className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted"
          >
            {post.meta}
          </Text>
        </View>
        <Tag
          label={post.author.rank}
          tone={post.author.rank === "Navigator" ? "gold" : "neutral"}
        />
      </View>

      {post.photoUri ? (
        <View className="aspect-[4/3] bg-space">
          <Image
            source={{ uri: post.photoUri }}
            contentFit="cover"
            transition={300}
            accessibilityLabel={`${post.object} photo`}
            className="flex-1"
          />
          <View className="absolute left-3 top-3">
            <Tag label={post.object} tone="dark" />
          </View>
          {post.photoCredit ? (
            <View className="absolute bottom-2.5 right-3 rounded-full bg-space/70 px-2 py-0.5">
              <Text className="font-mono text-[11px] text-ink/80">
                Photo · {post.photoCredit}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="flex-row px-4">
          <Tag label={post.object} />
        </View>
      )}

      <View className="gap-2.5 px-4 pt-3.5">
        <Text className="text-[15px] leading-[22px] text-ink/90">
          {post.caption}
        </Text>
        {post.pass ? <PassTrace {...post.pass} /> : null}
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          {post.verified ? (
            <View className="flex-row items-center gap-1">
              <Icon name="check" size={14} color={colors.accent} />
              <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-accent">
                Pass matched
              </Text>
            </View>
          ) : null}
          <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
            {post.details}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center px-1.5 py-1.5">
        <StarButton
          active={post.starred}
          count={post.starCount}
          onPress={onToggleStar}
        />
        <Pressable
          onPress={onOpenComments}
          accessibilityRole="button"
          accessibilityLabel={`${post.comments.length} comments`}
          className="h-11 flex-row items-center gap-1.5 px-2.5 active:opacity-60"
        >
          <Icon name="comment" color={colors.muted} />
          <Text className="text-sm font-semibold text-ink/80">
            {post.comments.length}
          </Text>
        </Pressable>
        <View className="flex-1" />
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onToggleSeen();
          }}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityState={{ selected: post.seen }}
          className={`h-9 flex-row items-center gap-1.5 rounded-full border px-3.5 active:opacity-60 ${post.seen ? "border-accent/50 bg-accent/15" : "border-line"}`}
        >
          {post.seen ? (
            <Icon name="check" size={14} color={colors.accent} />
          ) : null}
          <Text
            className={`text-[13px] font-semibold ${post.seen ? "text-accent" : "text-ink"}`}
          >
            {post.seen ? `Seen · ${post.seenCount}` : "Seen it too"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share post"
          className="h-11 w-11 items-center justify-center active:opacity-60"
        >
          <Icon name="share" color={colors.muted} />
        </Pressable>
      </View>
    </Card>
  );
}
