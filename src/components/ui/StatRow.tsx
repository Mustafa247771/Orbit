import { Fragment } from "react";
import { View } from "react-native";

import { Stat } from "./Stat";

type StatRowProps = {
  stats: readonly { label: string; value: string }[];
};

/** Stats side by side, split by thin dividers. */
export function StatRow({ stats }: StatRowProps) {
  return (
    <View className="flex-row items-center">
      {stats.map((stat, index) => (
        <Fragment key={stat.label}>
          {index > 0 ? <View className="h-9 w-px bg-line" /> : null}
          <View className="flex-1">
            <Stat label={stat.label} value={stat.value} center />
          </View>
        </Fragment>
      ))}
    </View>
  );
}
