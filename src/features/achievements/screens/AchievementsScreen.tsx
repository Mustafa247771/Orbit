import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { BadgeSheet } from "../components/BadgeSheet";
import { ConstellationMap } from "../components/ConstellationMap";
import { Leaderboard } from "../components/Leaderboard";
import { ProgressList } from "../components/ProgressList";
import { QuizPanel } from "../components/QuizPanel";
import { RankCard } from "../components/RankCard";
import {
  TABS,
  useAchievementsViewModel,
} from "../viewmodels/useAchievementsViewModel";

export default function AchievementsScreen() {
  const vm = useAchievementsViewModel();

  return (
    <StarryScreen>
      <ScreenHeader
        tone="gold"
        eyebrow="Your constellation"
        title={"Light up\nyour sky"}
        action={{
          icon: "share",
          label: "Share progress",
          onPress: vm.shareProgress,
        }}
      />

      <RankCard rank={vm.rank} progress={vm.rankProgress} stats={vm.stats} />

      <View className="mx-5 mt-6">
        <SegmentedControl
          label="Achievements view"
          options={TABS}
          value={vm.tab}
          onChange={vm.setTab}
          tone="gold"
        />
      </View>

      <Animated.View key={vm.tab} entering={FadeIn.duration(200)}>
        {vm.tab === "badges" ? (
          <>
            <ConstellationMap
              badges={vm.badges}
              earnedCount={vm.earnedCount}
              onSelect={vm.openBadge}
            />
            <ProgressList badges={vm.almostThere} onSelect={vm.openBadge} />
          </>
        ) : vm.tab === "leaderboard" ? (
          <Leaderboard entries={vm.leaderboard} you={vm.you} />
        ) : (
          <QuizPanel
            daily={vm.dailyQuiz}
            past={vm.pastQuizzes}
            onStart={() => {}}
          />
        )}
      </Animated.View>

      <BadgeSheet
        badge={vm.selected}
        onClose={vm.closeBadge}
        onShare={vm.shareBadge}
      />
    </StarryScreen>
  );
}
