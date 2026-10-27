import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/Icon";
import { StarryScreen } from "@/components/ui/StarryScreen";
import colors from "@/theme/colors";
import { CommentsSheet } from "../components/CommentsSheet";
import { CommunityHeader } from "../components/CommunityHeader";
import { PostCard } from "../components/PostCard";
import { useCommunityViewModel } from "../viewmodels/useCommunityViewModel";

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
      <CommunityHeader
        observers={vm.observers}
        moreObservers={vm.moreObservers}
        clearSkies={vm.clearSkies}
        scope={vm.scope}
        onScopeChange={vm.setScope}
        onLogSighting={vm.logSighting}
      />

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
