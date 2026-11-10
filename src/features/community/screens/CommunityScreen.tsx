import { RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Footnote } from "@/components/ui/Footnote";
import { FormMessage } from "@/components/ui/FormMessage";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StarryScreen } from "@/components/ui/StarryScreen";
import colors from "@/theme/colors";
import { CommentsSheet } from "../components/CommentsSheet";
import { CommunityEmblem } from "../components/CommunityEmblem";
import { ComposeSheet } from "../components/ComposeSheet";
import { FeedStatus } from "../components/FeedStatus";
import { ObserverConstellation } from "../components/ObserverConstellation";
import { ObserverSearchSheet } from "../components/ObserverSearchSheet";
import { PostCard } from "../components/PostCard";
import { ReportSheet } from "../components/ReportSheet";
import { SightingPrompt } from "../components/SightingPrompt";
import { SCOPES } from "../model/communityViews";
import { useCommunityViewModel } from "../viewmodels/useCommunityViewModel";

export default function CommunityScreen() {
  const {
    identity,
    feed,
    presence,
    compose,
    autoPublish,
    comments,
    report,
    search,
    navigation,
    localMode,
  } = useCommunityViewModel();

  return (
    <>
      <StarryScreen
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={feed.refresh}
            tintColor={colors.violet}
            colors={[colors.violet]}
          />
        }
        overlay={
          <SafeAreaView
            edges={["bottom"]}
            pointerEvents="box-none"
            className="absolute bottom-0 right-5 pb-6"
          >
            <Button label="Log sighting" icon="camera" size="lg" onPress={navigation.logSighting} />
          </SafeAreaView>
        }
      >
        <ScreenHeader
          tone="violet"
          eyebrow="The shared sky"
          title="Community."
          subtitle={presence.subtitle}
          trailing={<CommunityEmblem />}
          action={{
            icon: "search",
            label: "Search observers",
            onPress: search.open,
          }}
        />
        <ObserverConstellation
          observers={presence.observers}
          moreObservers={presence.moreObservers}
        />
        <FormMessage className="mx-5 mt-2">{presence.error}</FormMessage>
        <View className="mx-5 mt-5">
          <SegmentedControl
            label="Feed"
            options={SCOPES}
            value={feed.scope}
            onChange={feed.setScope}
            tone="violet"
          />
        </View>
        <SightingPrompt initials={identity.initials} onPress={compose.open} />
        <FormMessage className="mx-5 mt-3" tone="accent">
          {compose.notice}
        </FormMessage>
        <FormMessage className="mx-5 mt-3" tone="gold">
          {autoPublish.notice}
        </FormMessage>
        <FormMessage className="mx-5 mt-3" tone="accent">
          {report.notice}
        </FormMessage>
        <FormMessage className="mx-5 mt-3">{feed.followingError}</FormMessage>
        <FeedStatus
          loading={feed.loading}
          empty={!feed.posts.length}
          offline={feed.offline}
          error={feed.error}
          emptyMessage={feed.emptyMessage}
          onRetry={feed.refresh}
        />
        <View className="mx-5 mt-6 gap-4">
          {feed.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleStar={() => feed.toggleStar(post.id)}
              onToggleSeen={() => feed.toggleSeen(post.id)}
              onOpenComments={() => comments.open(post.id)}
              onShare={() => {
                void feed.share(post);
              }}
              onReport={() => report.open(post.id)}
              onDelete={() => feed.deletePost(post.id)}
              onFollow={() => {
                void feed.followAuthor(post.author.uid);
              }}
            />
          ))}
          {feed.hasMore ? (
            <Button
              label="Load more"
              variant="outline"
              tone="cyan"
              loading={feed.loadingMore}
              disabled={feed.loading || feed.refreshing}
              onPress={feed.loadMore}
            />
          ) : null}
        </View>
        {localMode ? <Footnote>Local demo mode — posts stay on this phone</Footnote> : null}
      </StarryScreen>

      <ComposeSheet
        visible={compose.visible}
        caption={compose.caption}
        objectName={compose.objectName}
        photoUri={compose.photoUri}
        photosAvailable={compose.photosAvailable}
        busy={compose.busy}
        picking={compose.picking}
        errors={compose.errors}
        error={compose.error}
        onClose={compose.close}
        onCaption={compose.setCaption}
        onObjectName={compose.setObjectName}
        onTakePhoto={compose.takePhoto}
        onChoosePhoto={compose.choosePhoto}
        onRemovePhoto={compose.removePhoto}
        onSubmit={compose.submit}
      />
      <CommentsSheet
        visible={comments.postId !== null}
        comments={comments.items}
        text={comments.text}
        loading={comments.loading}
        busy={comments.busy}
        error={comments.error}
        inputError={comments.inputError}
        onClose={comments.close}
        onChangeText={comments.setText}
        onAdd={comments.add}
        onDelete={comments.deleteComment}
        onRetry={comments.retry}
      />
      <ReportSheet
        visible={report.postId !== null}
        reason={report.reason}
        note={report.note}
        errors={report.errors}
        error={report.error}
        busy={report.busy}
        onClose={report.close}
        onReason={report.setReason}
        onNote={report.setNote}
        onSubmit={report.submit}
      />
      <ObserverSearchSheet
        visible={search.visible}
        query={search.query}
        results={search.results}
        loading={search.loading}
        searched={search.searched}
        error={search.error}
        followError={search.followError}
        followingReady={search.followingReady}
        onClose={search.close}
        onQuery={search.setQuery}
        onSearch={search.search}
        onToggleFollow={search.toggleFollow}
      />
    </>
  );
}
