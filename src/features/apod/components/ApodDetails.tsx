import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Label";
import { useReduceMotion } from "@/core/preferences";
import colors from "@/theme/colors";
import type { ApodEntry } from "../model/Apod";

export type ApodDetailsProps = {
  entry: ApodEntry;
  archive: readonly ApodEntry[];
  savedCount: number;
  onOpenStory: () => void;
  onSelectDay: (date: string) => void;
  onOpenSaved: () => void;
};

function ArchiveCard({
  entry,
  onSelect,
}: {
  entry: ApodEntry;
  onSelect: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReduceMotion();
  const uri = entry.thumbnailUrl ?? entry.imageUrl;
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Explore ${entry.date}: ${entry.title}`}
      className="mb-3 active:opacity-60"
    >
      <Card>
        <View>
          <View className="h-40 items-center justify-center bg-shade">
            {uri && !failed ? (
              <Image
                source={{ uri }}
                contentFit="cover"
                transition={reduceMotion ? 0 : 150}
                accessibilityLabel={entry.title}
                className="h-full w-full"
                onError={() => setFailed(true)}
              />
            ) : (
              <Icon name="photo" size={28} color={colors.muted} />
            )}
          </View>
          <View className="gap-2 p-4">
            <Label>{entry.date}</Label>
            <Text numberOfLines={2} className="font-display text-lg text-ink">
              {entry.title}
            </Text>
            <Label tone="cyan">Explore day ↗</Label>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function ApodDetails({
  entry,
  archive,
  savedCount,
  onOpenStory,
  onSelectDay,
  onOpenSaved,
}: ApodDetailsProps) {
  return (
    <View className="px-6">
      <View className="mt-8 gap-4 border-y border-edge-dim py-7">
        <Label>Inside the discovery</Label>
        <Text
          accessibilityRole="header"
          className="font-display text-[29px] leading-[33px] text-ink"
        >
          About this discovery
        </Text>
        <Text selectable className="text-sm leading-6 text-haze">
          {entry.explanation ||
            "NASA has not supplied an explanation for this discovery."}
        </Text>
        <Text
          selectable
          className="text-xs leading-5 text-muted"
        >{`Credit: ${entry.copyright ?? "NASA / APOD"}`}</Text>
        <Button
          label="Read the full story"
          variant="ghost"
          tone="cyan"
          icon="open"
          onPress={onOpenStory}
        />
      </View>
      <View className="mt-8 gap-2">
        <Label>Keep exploring</Label>
        <Text
          accessibilityRole="header"
          className="mb-3 font-display text-[30px] text-ink"
        >
          The archive.
        </Text>
        {archive.map((day) => (
          <ArchiveCard
            key={`${day.date}-${day.thumbnailUrl ?? day.imageUrl}`}
            entry={day}
            onSelect={() => onSelectDay(day.date)}
          />
        ))}
        {archive.length === 0 ? (
          <Text className="py-4 text-sm text-muted">
            Recent discoveries will appear here.
          </Text>
        ) : null}
      </View>
      <View className="mt-5 flex-row items-center gap-3 border-y border-edge-dim py-6">
        <Icon name="bookmark" size={23} color={colors.gold} />
        <View className="flex-1 gap-1">
          <Text className="font-display text-base text-ink">
            Saved discoveries
          </Text>
          <Text className="text-xs text-muted">{`${savedCount} ${savedCount === 1 ? "discovery" : "discoveries"}`}</Text>
        </View>
        <Button
          label="View"
          accessibilityLabel={`Open saved discoveries, ${savedCount} saved`}
          variant="ghost"
          tone="gold"
          onPress={onOpenSaved}
        />
      </View>
    </View>
  );
}
