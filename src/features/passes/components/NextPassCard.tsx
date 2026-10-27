import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Countdown } from "@/components/ui/Countdown";
import { Label } from "@/components/ui/Label";
import { StatRow } from "@/components/ui/StatRow";
import { Tag } from "@/components/ui/Tag";
import type { NextPass } from "../model/Pass";

type NextPassCardProps = {
  pass: NextPass;
  secondsLeft: number;
};

/** Tonight's pass: time, path, countdown and viewing conditions. */
export function NextPassCard({ pass, secondsLeft }: NextPassCardProps) {
  return (
    <Card className="mx-5 mt-5 gap-5 p-5">
      <View className="flex-row items-center justify-between">
        <Tag dot label={pass.conditions} tone="accent" />
        <Label>Predicted</Label>
      </View>

      <View className="gap-1">
        <Label>Next visible pass</Label>
        <Text className="font-display text-[52px] leading-[58px] tracking-[-2px] text-ink">
          {pass.time}{" "}
          <Text className="text-[19px] tracking-normal text-muted">
            {pass.period}
          </Text>
        </Text>
        <Text className="text-[15px] text-muted">{pass.when}</Text>
      </View>

      <View className="items-center gap-3 rounded-2xl border border-line bg-space/50 py-4">
        <Label>Begins in</Label>
        <Countdown seconds={secondsLeft} />
      </View>

      <StatRow
        stats={[
          { label: "Visible", value: pass.visible },
          { label: "Max elev.", value: pass.maxElevation },
          { label: "Clouds", value: pass.clouds },
        ]}
      />
    </Card>
  );
}
