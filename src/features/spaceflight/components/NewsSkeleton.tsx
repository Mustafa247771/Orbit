import { View } from "react-native";

import { Skeleton } from "@/components/ui/Skeleton";

const ROWS = [0, 1, 2, 3];

export function NewsSkeleton() {
  return (
    <View accessibilityLabel="Loading news" className="mx-5 mt-5 gap-6">
      <View className="gap-3">
        <Skeleton height={208} radius={28} />
        <Skeleton width="40%" height={12} />
        <Skeleton height={22} />
        <Skeleton width="70%" height={22} />
      </View>
      {ROWS.map((row) => (
        <View key={row} className="flex-row gap-3.5">
          <Skeleton width={84} height={84} radius={16} />
          <View className="flex-1 gap-2 pt-1">
            <Skeleton width="45%" height={11} />
            <Skeleton height={15} />
            <Skeleton width="80%" height={15} />
          </View>
        </View>
      ))}
    </View>
  );
}
