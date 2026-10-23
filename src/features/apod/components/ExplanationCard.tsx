import { useState } from "react";
import { Pressable, Text } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { Card } from "@/components/ui/Card";

const COLLAPSED_LINES = 5;
const LONG_TEXT = 260;

type ExplanationCardProps = {
  text: string;
};

export function ExplanationCard({ text }: ExplanationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > LONG_TEXT;

  return (
    <Animated.View
      layout={LinearTransition.duration(250)}
      style={{ marginHorizontal: 20, marginTop: 24 }}
    >
      <Card className="gap-3 p-5">
        <Text className="font-mono text-[11px] uppercase tracking-[2px] text-muted">
          About this picture
        </Text>
        <Text
          numberOfLines={expanded || !long ? undefined : COLLAPSED_LINES}
          className="text-[15px] leading-[23px] text-ink/90"
        >
          {text || "NASA has not published a description for this picture."}
        </Text>
        {long && (
          <Pressable
            onPress={() => setExpanded((current) => !current)}
            hitSlop={12}
            accessibilityRole="button"
            className="self-start active:opacity-60"
          >
            <Text className="text-sm font-semibold text-cyan">
              {expanded ? "Show less" : "Read more"}
            </Text>
          </Pressable>
        )}
      </Card>
    </Animated.View>
  );
}
