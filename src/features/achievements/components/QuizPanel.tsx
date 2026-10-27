import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Label } from "@/components/ui/Label";
import type { DailyQuiz, PastQuiz } from "../model/Achievement";

type QuizPanelProps = {
  daily: DailyQuiz;
  past: PastQuiz[];
  onStart: () => void;
};

export function QuizPanel({ daily, past, onStart }: QuizPanelProps) {
  return (
    <View className="mx-5 mt-6 gap-8">
      <View className="gap-2.5 rounded-[28px] border border-gold/40 bg-surface/80 p-5">
        <Label tone="gold">Daily orbit quiz</Label>
        <Text className="font-display text-2xl text-ink">
          {daily.questions} questions · +{daily.xp} XP
        </Text>
        <Text className="text-sm leading-5 text-muted">{daily.note}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onStart();
          }}
          accessibilityRole="button"
          className="mt-1.5 h-12 justify-center self-start rounded-full bg-gold px-6 active:opacity-80"
        >
          <Text className="text-[15px] font-semibold text-space">
            Start quiz
          </Text>
        </Pressable>
      </View>

      <View>
        <SectionLabel title="Past quizzes" />
        <Card>
          {past.map((quiz, index) => (
            <View
              key={quiz.id}
              className={`flex-row items-center gap-3 px-4 py-3.5 ${index === past.length - 1 ? "" : "border-b border-line"}`}
            >
              <View className="flex-1 gap-1">
                <Text className="text-[15px] font-semibold text-ink">
                  {quiz.title}
                </Text>
                <Label>{quiz.date}</Label>
              </View>
              <Text className="font-mono text-xs text-ink/80">
                {quiz.score}/{quiz.outOf}
              </Text>
              <Text className="w-16 text-right font-mono text-xs text-gold">
                +{quiz.xp} XP
              </Text>
            </View>
          ))}
        </Card>
      </View>
    </View>
  );
}
