import { useCallback, useMemo, useState } from "react";
import { Share } from "react-native";

import type { Badge } from "../model/Achievement";
import {
    BADGES,
    DAILY_QUIZ,
    LEADERBOARD,
    PAST_QUIZZES,
    RANK,
    RANK_STATS,
    YOUR_PLACE,
} from "../model/sampleAchievements";

export const TABS = [
  { value: "badges", label: "Badges" },
  { value: "leaderboard", label: "Leaderboard" },
  { value: "quizzes", label: "Quizzes" },
] as const;

export type AchievementsTab = (typeof TABS)[number]["value"];
export type BadgeState = "earned" | "progress" | "locked";
export type BadgeView = Badge & {
  state: BadgeState;
  percent: number;
  stateLabel: string;
};

function toView(badge: Badge): BadgeView {
  const percent = Math.min(1, badge.progress / badge.goal);
  if (badge.earnedAt) {
    const date = new Date(badge.earnedAt).toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return {
      ...badge,
      state: "earned",
      percent,
      stateLabel: `Unlocked · ${date}`,
    };
  }
  if (badge.progress > 0) {
    return {
      ...badge,
      state: "progress",
      percent,
      stateLabel: `In progress · ${badge.progress} of ${badge.goal}`,
    };
  }
  return { ...badge, state: "locked", percent, stateLabel: "Locked" };
}

export function useAchievementsViewModel() {
  const [tab, setTab] = useState<AchievementsTab>("badges");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const badges = useMemo(() => BADGES.map(toView), []);
  const earnedCount = badges.filter((badge) => badge.state === "earned").length;
  const almostThere = useMemo(
    () =>
      badges
        .filter((badge) => badge.state === "progress")
        .sort((a, b) => b.percent - a.percent),
    [badges],
  );

  const shareBadge = useCallback((badge: BadgeView) => {
    Share.share({ message: `I earned the ${badge.title} badge on Orbit.` });
  }, []);

  const shareProgress = useCallback(() => {
    Share.share({
      message: `I'm an ${RANK.title} (level ${RANK.level}) on Orbit with ${earnedCount} badges lit.`,
    });
  }, [earnedCount]);

  return {
    tab,
    setTab,
    rank: RANK,
    rankProgress: RANK.xp / RANK.nextXp,
    stats: RANK_STATS,
    badges,
    earnedCount,
    almostThere,
    leaderboard: LEADERBOARD,
    you: YOUR_PLACE,
    dailyQuiz: DAILY_QUIZ,
    pastQuizzes: PAST_QUIZZES,
    selected: badges.find((badge) => badge.id === selectedId) ?? null,
    openBadge: setSelectedId,
    closeBadge: () => setSelectedId(null),
    shareBadge,
    shareProgress,
  };
}
