import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { CommentsSheet } from "../components/CommentsSheet";
import { CommunityEmblem } from "../components/CommunityEmblem";
import { ObserverConstellation } from "../components/ObserverConstellation";
import { PostCard } from "../components/PostCard";
import { SightingPrompt } from "../components/SightingPrompt";
import {
  SCOPES,
  useCommunityViewModel,
} from "../viewmodels/useCommunityViewModel";

const noop = () => {};

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
          <Button
            label="Log sighting"
            icon="camera"
            size="lg"
            onPress={vm.logSighting}
          />
        </SafeAreaView>
      }
    >
      <ScreenHeader
        tone="violet"
        eyebrow="The shared sky"
        title="Community."
        subtitle={`${vm.clearSkies} observers under clear skies`}
        trailing={<CommunityEmblem />}
        action={{ icon: "search", label: "Search observers", onPress: noop }}
      />

      <ObserverConstellation
        observers={vm.observers}
        moreObservers={vm.moreObservers}
      />

      <View className="mx-5 mt-5">
        <SegmentedControl
          label="Feed"
          options={SCOPES}
          value={vm.scope}
          onChange={vm.setScope}
          tone="violet"
        />
      </View>

      <SightingPrompt initials={vm.myInitials} onPress={vm.logSighting} />

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
