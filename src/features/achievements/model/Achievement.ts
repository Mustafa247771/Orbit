import type { IconName } from "@/components/ui/Icon";

export type BadgeTier = "gold" | "silver";

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  tier: BadgeTier;
  xp: number;
  progress: number;
  goal: number;
  earnedAt: string | null;
  /** Share of observers who have it, in percent. */
  rarity: number;
  /** Position on the constellation map, 0 to 1 across and down. */
  x: number;
  y: number;
  links: string[];
};

export type Rank = {
  title: string;
  level: number;
  xp: number;
  nextTitle: string;
  nextXp: number;
};

export type LeaderboardEntry = {
  id: string;
  place: number;
  name: string;
  initials: string;
  xp: number;
  change?: number;
};

export type DailyQuiz = {
  questions: number;
  xp: number;
  note: string;
};

export type PastQuiz = {
  id: string;
  title: string;
  date: string;
  score: number;
  outOf: number;
  xp: number;
};
