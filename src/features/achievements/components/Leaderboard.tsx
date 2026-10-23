import { Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import type { LeaderboardEntry } from "../model/Achievement";

// Second, first, third from left to right, like a real podium.
const PODIUM = [
  { place: 2, height: 64 },
  { place: 1, height: 92 },
  { place: 3, height: 48 },
];

const xpLabel = (xp: number) => `${xp.toLocaleString("en-US")} XP`;

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  you: LeaderboardEntry;
};

export function Leaderboard({ entries, you }: LeaderboardProps) {
  const rest = entries.filter((entry) => entry.place > 3);

  return (
    <View className="mx-5 mt-6 gap-4">
      <Card className="px-4 pb-4 pt-5">
        <View className="flex-row items-end justify-center gap-3">
          {PODIUM.map(({ place, height }) => {
            const entry = entries.find((item) => item.place === place);
            if (!entry) return null;
            const first = place === 1;
            return (
              <View key={entry.id} className="w-24 items-center gap-2">
                <Avatar initials={entry.initials} size={first ? 64 : 52} />
                <Text className="text-[13px] font-semibold text-ink">
                  {entry.name}
                </Text>
                <Text
                  className={`font-mono text-[11px] ${first ? "text-gold" : "text-muted"}`}
                >
                  {xpLabel(entry.xp)}
                </Text>
                <View
                  className={`w-full items-center rounded-t-2xl border pt-2.5 ${first ? "border-gold/40 bg-gold/10" : "border-line bg-surface"}`}
                  style={{ height }}
                >
                  <Text
                    className={`font-display text-xl ${first ? "text-gold" : "text-ink"}`}
                  >
                    {place}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        {rest.map((entry, index) => (
          <View
            key={entry.id}
            className={`flex-row items-center gap-3 px-4 py-3 ${index === rest.length - 1 ? "" : "border-b border-line"}`}
          >
            <Text className="w-7 font-mono text-xs text-muted">
              {entry.place}
            </Text>
            <Avatar initials={entry.initials} size={36} />
            <Text className="flex-1 text-[15px] font-semibold text-ink">
              {entry.name}
            </Text>
            <Text className="font-mono text-[11px] text-muted">
              {xpLabel(entry.xp)}
            </Text>
          </View>
        ))}
      </Card>

      <View className="flex-row items-center gap-3 rounded-2xl border border-accent/50 bg-accent/10 px-4 py-3">
        <Text className="w-7 font-mono text-xs text-accent">#{you.place}</Text>
        <Avatar initials={you.initials} size={36} />
        <Text className="flex-1 text-[15px] font-semibold text-ink">
          {you.name}
        </Text>
        <Text className="font-mono text-[11px] text-ink/80">
          {xpLabel(you.xp)}
        </Text>
        {you.change ? (
          <Text className="font-mono text-[11px] text-accent">
            +{you.change}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
