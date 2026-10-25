import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/Icon";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StarryScreen } from "@/components/ui/StarryScreen";
import colors from "@/theme/colors";
import { CommentsSheet } from "../components/CommentsSheet";
import { ObserverRow } from "../components/ObserverRow";
import { PostCard } from "../components/PostCard";
import {
  SCOPES,
  useCommunityViewModel,
} from "../viewmodels/useCommunityViewModel";

export default function CommunityScreen() {
  const vm = useCommunityViewModel();

  return (
    <StarryScreen
      overlay={
        <SafeAreaView
          edges={["bottom"]}
          pointerEvents="box-none"
          className="absolute bottom-0 right-5 pb-6"
        >
          <Pressable
            onPress={vm.logSighting}
            accessibilityRole="button"
            className="h-14 flex-row items-center gap-2.5 rounded-full bg-accent px-5 active:opacity-80"
          >
            <Icon name="camera" color={colors.space} />
            <Text className="text-[15px] font-semibold text-space">
              Log sighting
            </Text>
          </Pressable>
        </SafeAreaView>
      }
    >
      <ScreenHeader
        eyebrow="Community"
        title="Sky feed"
        action={{
          icon: "search",
          label: "Search observers",
          onPress: () => {},
        }}
      />
      <ScreenTitle>{"Eyes on\nthe same sky."}</ScreenTitle>
      <View className="mt-3.5 flex-row items-center gap-2 px-5">
        <View className="h-2 w-2 rounded-full bg-accent" />
        <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
          {vm.clearSkies} observers under clear skies
        </Text>
      </View>

      <View className="mx-5 mt-6">
        <SegmentedControl
          label="Feed"
          options={SCOPES}
          value={vm.scope}
          onChange={vm.setScope}
        />
      </View>

      <View className="mt-7">
        <View className="px-5">
          <SectionLabel
            title="Out tonight near Cairo"
            action={{ label: "See all", onPress: () => {} }}
          />
        </View>
        <ObserverRow
          observers={vm.observers}
          more={vm.moreObservers}
          onAddSighting={vm.logSighting}
        />
      </View>

      <View className="mx-5 mt-6 gap-4">
        {vm.feed.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleStar={() => vm.toggleStar(post.id)}
            onToggleSeen={() => vm.toggleSeen(post.id)}
            onOpenComments={() => vm.openComments(post.id)}
            onShare={() => vm.share(post)}
          />
        ))}
      </View>

      <CommentsSheet
        post={vm.commentsPost}
        onClose={vm.closeComments}
        onSend={vm.addComment}
      />
    </StarryScreen>
  );
}
