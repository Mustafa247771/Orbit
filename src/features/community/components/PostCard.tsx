import { Image } from "expo-image";
import { Alert, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Label } from "@/components/ui/Label";
import { Tag } from "@/components/ui/Tag";
import type { PostView } from "../model/communityViews";

type PostCardProps = {
  post: PostView;
  onToggleStar: () => void;
  onToggleSeen: () => void;
  onOpenComments: () => void;
  onShare: () => void;
  onReport: () => void;
  onDelete: () => void;
  onFollow: () => void;
};

export function PostCard({
  post,
  onToggleStar,
  onToggleSeen,
  onOpenComments,
  onShare,
  onReport,
  onDelete,
  onFollow,
}: PostCardProps) {
  const confirmDelete = () =>
    Alert.alert("Delete post?", "This also deletes all comments on this post.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  const overflow = () =>
    Alert.alert("Post options", post.objectName, [
      { text: "Report", onPress: onReport },
      post.own
        ? { text: "Delete", style: "destructive", onPress: confirmDelete }
        : {
            text: post.following ? "Unfollow observer" : "Follow observer",
            onPress: onFollow,
          },
      { text: "Cancel", style: "cancel" },
    ]);

  return (
    <Card>
      <View className="flex-row items-center gap-3 px-4 py-3.5">
        <Avatar initials={post.author.initials} />
        <View className="flex-1 gap-1.5">
          <Text className="text-[15px] font-semibold text-ink">{post.author.name}</Text>
          <Label>{`${post.city ? `${post.city} · ` : ""}${post.ago}`}</Label>
          <View className="flex-row">
            <Tag label={post.author.rank} tone="gold" />
          </View>
        </View>
        <IconButton
          icon="menu"
          label={`Options for ${post.author.name}'s post`}
          onPress={overflow}
        />
      </View>
      {post.photoUrl ? (
        <Image
          source={{ uri: post.photoUrl }}
          contentFit="cover"
          accessibilityLabel={`${post.objectName} photo`}
          className="aspect-[4/3] w-full bg-space"
        />
      ) : null}
      <View className="gap-3 px-4 pt-3.5">
        <View className="flex-row flex-wrap">
          <Tag label={post.objectName} tone="cyan" />
        </View>
        <Text className="text-[15px] leading-[22px] text-ink/90">{post.caption}</Text>
      </View>
      <View className="flex-row flex-wrap items-center gap-1 px-2 py-2">
        <Button
          label={`${post.starredBy.length}`}
          icon={post.starred ? "starFilled" : "star"}
          accessibilityLabel={`${post.starred ? "Unstar" : "Star"} post, ${post.starredBy.length} stars`}
          variant="ghost"
          tone={post.starred ? "gold" : "cyan"}
          className="px-2"
          onPress={onToggleStar}
        />
        <Button
          label={`${post.commentCount}`}
          icon="comment"
          accessibilityLabel={`Open ${post.commentCount} comments`}
          variant="ghost"
          tone="cyan"
          className="px-2"
          onPress={onOpenComments}
        />
        <Button
          label={`${post.seen ? "Seen" : "Seen too"} · ${post.seenBy.length}`}
          icon={post.seen ? "check" : "eye"}
          accessibilityLabel={`${post.seen ? "Unmark" : "Mark"} seen, ${post.seenBy.length} observers saw this`}
          variant={post.seen ? "outline" : "ghost"}
          className="px-2"
          onPress={onToggleSeen}
        />
        <View className="flex-1" />
        <IconButton icon="share" label="Share post" onPress={onShare} />
      </View>
    </Card>
  );
}
