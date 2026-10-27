import { Footnote } from "@/components/ui/Footnote";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { StateMessage } from "@/components/ui/StateMessage";
import colors from "@/theme/colors";
import { RefreshControl, View } from "react-native";
import { ArticleRow } from "../components/ArticleRow";
import { CategoryChips } from "../components/CategoryChips";
import { FeaturedArticle } from "../components/FeaturedArticle";
import { NewsSkeleton } from "../components/NewsSkeleton";
import { NewsTicker } from "../components/NewsTicker";
import {
  CATEGORIES,
  useSpaceflightViewModel,
} from "../viewmodels/useSpaceflightViewModel";

export default function SpaceflightScreen() {
  const vm = useSpaceflightViewModel();
  const { featured } = vm;

  return (
    <StarryScreen
      refreshControl={
        <RefreshControl
          refreshing={vm.refreshing}
          onRefresh={vm.refresh}
          tintColor={colors.cyan}
        />
      }
    >
      <ScreenHeader
        tone="cyan"
        eyebrow="Spaceflight news"
        title={"Signal from\nthe frontier."}
        action={{
          icon: "bookmark",
          label: "Saved articles",
          onPress: () => {},
        }}
      />

      {vm.headline ? (
        <NewsTicker headline={vm.headline} tick={vm.tick} />
      ) : null}
      <CategoryChips
        categories={CATEGORIES}
        value={vm.category}
        onChange={vm.setCategory}
      />

      {vm.loading ? (
        <NewsSkeleton />
      ) : vm.error && !featured ? (
        <StateMessage
          title="No signal right now"
          message={vm.error}
          onRetry={vm.retry}
        />
      ) : featured ? (
        <>
          <FeaturedArticle
            article={featured}
            onOpen={() => vm.open(featured)}
          />
          {vm.latest.length > 0 && (
            <View className="mx-5 mt-8">
              <SectionLabel title={`Latest · ${vm.latest.length} stories`} />
              {vm.latest.map((article, index) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  saved={vm.saved.has(article.id)}
                  last={index === vm.latest.length - 1}
                  onOpen={() => vm.open(article)}
                  onToggleSaved={() => vm.toggleSaved(article.id)}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <StateMessage message="No stories on this topic in the latest feed." />
      )}

      <Footnote>News via Spaceflight News API</Footnote>
    </StarryScreen>
  );
}
