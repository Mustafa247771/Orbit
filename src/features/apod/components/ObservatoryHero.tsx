import { Image } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { StateMessage } from "@/components/ui/StateMessage";
import { Tag } from "@/components/ui/Tag";
import { useReduceMotion } from "@/core/preferences";
import colors from "@/theme/colors";
import type { ApodEntry } from "../model/Apod";

export type ObservatoryHeroProps = {
  entry: ApodEntry | null;
  loading?: boolean;
  source: "live" | "offline";
  saved: boolean;
  busy?: boolean;
  onExpand: () => void;
  onWatch: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
};

function LensImage({ uri, title }: { uri: string | null; title: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const reduceMotion = useReduceMotion();
  return (
    <View className="absolute inset-[6%] overflow-hidden rounded-full bg-shade">
      {uri && status !== "error" ? (
        <Image
          source={{ uri }}
          contentFit="cover"
          transition={reduceMotion ? 0 : 180}
          accessibilityLabel={title}
          className="h-full w-full"
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
        />
      ) : (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Icon name="photo" size={32} color={colors.muted} />
          <Text className="text-center text-sm text-muted">
            Preview unavailable
          </Text>
        </View>
      )}
      {uri && status === "loading" ? (
        <View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center bg-shade"
          accessibilityLabel="Loading picture"
          accessibilityRole="progressbar"
        >
          <Skeleton width="70%" height={160} radius={80} />
        </View>
      ) : null}
    </View>
  );
}

export function ObservatoryHero({
  entry,
  loading = false,
  source,
  saved,
  busy = false,
  onExpand,
  onWatch,
  onToggleFavorite,
  onShare,
}: ObservatoryHeroProps) {
  const uri =
    entry?.kind === "image"
      ? (entry.imageUrl ?? entry.hdUrl)
      : (entry?.thumbnailUrl ?? entry?.imageUrl ?? null);
  return (
    <View className="mt-3 overflow-hidden">
      <View className="mx-2 aspect-square">
        {loading ? (
          <View
            className="absolute inset-[6%] items-center justify-center overflow-hidden rounded-full bg-shade"
            accessibilityRole="progressbar"
            accessibilityLabel="Loading discovery"
          >
            <Skeleton width="80%" height={180} radius={90} />
          </View>
        ) : entry ? (
          <LensImage
            key={`${entry.date}-${uri}`}
            uri={uri}
            title={entry.title}
          />
        ) : null}
        <View
          pointerEvents="none"
          className="absolute inset-0"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Svg width="100%" height="100%" viewBox="0 0 400 400">
            <G fill="none" stroke={colors.edge.bright} strokeWidth={0.7}>
              <Circle cx={200} cy={200} r={188} />
              <Circle
                cx={200}
                cy={200}
                r={181}
                stroke={colors.ink}
                opacity={0.15}
              />
              <Path d="M200 0v17m0 366v17M0 200h17m366 0h17M62 62l10 10m256 256 10 10M62 338l10-10M328 72l10-10" />
              <Path
                d="M13 173A190 190 0 0 1 87 47"
                stroke={colors.cyan}
                strokeWidth={1.2}
              />
              <Circle
                cx={87}
                cy={47}
                r={4}
                fill={colors.cyan}
                stroke={colors.space}
                strokeWidth={2}
              />
            </G>
            <G fill={colors.ice} opacity={0.6}>
              <Circle cx={24} cy={60} r={1} />
              <Circle cx={372} cy={106} r={1.5} />
              <Circle cx={35} cy={338} r={1.2} />
            </G>
          </Svg>
        </View>
        {!loading &&
        entry?.kind === "image" &&
        (entry.imageUrl || entry.hdUrl) ? (
          <View className="absolute bottom-[12%] right-[11%]">
            <IconButton
              icon="expand"
              label={`Expand ${entry.title}`}
              onPress={onExpand}
            />
          </View>
        ) : null}
      </View>
      {loading ? (
        <StateMessage loading message="Loading NASA discovery…" />
      ) : entry ? (
        <View className="items-center gap-3 px-6">
          <Label tone="cyan">NASA · Astronomy picture of the day</Label>
          <Text
            accessibilityRole="header"
            numberOfLines={3}
            className="text-center font-display text-[36px] leading-[40px] tracking-[-1px] text-ink"
          >
            {entry.title}
          </Text>
          <Text className="text-center text-xs leading-5 text-haze">{`${entry.date} · ${entry.copyright ?? "NASA / APOD"}`}</Text>
          <Tag
            label={source === "offline" ? "Saved offline" : "Live"}
            tone={source === "offline" ? "gold" : "cyan"}
            dot
          />
          {entry.kind === "video" ? (
            <Button
              label="Watch video"
              icon="open"
              tone="cyan"
              variant="outline"
              onPress={onWatch}
            />
          ) : null}
          <View className="mt-2 flex-row flex-wrap items-center justify-center gap-3">
            <Button
              label={saved ? "Saved" : "Favourite"}
              accessibilityLabel={`${saved ? "Remove from" : "Add to"} favourites: ${entry.title}`}
              icon={saved ? "bookmarkFilled" : "bookmark"}
              loading={busy}
              tone="cyan"
              onPress={onToggleFavorite}
            />
            <IconButton
              icon="share"
              label={`Share ${entry.title}`}
              onPress={onShare}
            />
          </View>
        </View>
      ) : (
        <StateMessage
          title="No discovery selected"
          message="Choose a day to explore NASA’s archive."
        />
      )}
    </View>
  );
}
