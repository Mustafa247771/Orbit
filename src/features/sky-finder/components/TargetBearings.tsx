import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { StatRow } from "@/components/ui/StatRow";
import { Tag } from "@/components/ui/Tag";
import type { SkyTarget } from "../viewmodels/useSkyFinderViewModel";

type TargetBearingsProps = {
  target: SkyTarget;
  statusLabel: string;
  sensorsLive: boolean;
};

/** Where to look in plain numbers, for when the sensors can't help. */
export function TargetBearings({
  target,
  statusLabel,
  sensorsLive,
}: TargetBearingsProps) {
  return (
    <Card className="mx-5 mt-4 gap-3 p-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1">
          <Label>Numeric fallback</Label>
          <Text className="text-[17px] font-semibold text-ink">
            Target bearings
          </Text>
        </View>
        <Tag dot label={statusLabel} tone={sensorsLive ? "accent" : "gold"} />
      </View>
      <StatRow
        stats={[
          { label: "Azimuth", value: target.azimuth },
          { label: "Elevation", value: target.elevation },
          { label: "Visible", value: target.visible },
        ]}
      />
    </Card>
  );
}
