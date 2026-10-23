import { Pressable, RefreshControl, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StarryScreen } from "@/components/ui/StarryScreen";
import colors from "@/theme/colors";
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
        eyebrow="Incoming transmissions"
        title="Spaceflight news"
        action={{
          icon: "bookmark",
          label: "Saved articles",
          onPress: () => {},
        }}
      />
      <ScreenTitle>{"Signal from\nthe frontier."}</ScreenTitle>

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
        <Card className="mx-5 mt-5 items-start gap-2 p-5">
          <Text className="text-[17px] font-semibold text-ink">
            No signal right now
          </Text>
          <Text className="text-sm leading-5 text-muted">{vm.error}</Text>
          <Pressable
            onPress={vm.retry}
            accessibilityRole="button"
            className="mt-2 h-11 justify-center rounded-full border border-cyan/50 px-5 active:opacity-60"
          >
            <Text className="text-sm font-semibold text-cyan">Try again</Text>
          </Pressable>
        </Card>
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
        <Card className="mx-5 mt-5 p-5">
          <Text className="text-sm leading-5 text-muted">
            No stories on this topic in the latest feed.
          </Text>
        </Card>
      )}

      <Text className="mx-5 mt-6 text-center font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
        News via Spaceflight News API
      </Text>
    </StarryScreen>
  );
}
