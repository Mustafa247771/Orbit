import { Text, View } from "react-native";

import { StarryScreen } from "@/components/ui/StarryScreen";
import { ApodDetails } from "../components/ApodDetails";
import { ApodHeader } from "../components/ApodHeader";
import { ObservatoryHero } from "../components/ObservatoryHero";
import { useApodViewModel } from "../viewmodels/useApodViewModel";

export default function ApodScreen() {
  const vm = useApodViewModel();

  return (
    <StarryScreen>
      <ApodHeader />

      {vm.loading ? (
        <View className="mx-6 mt-8">
          <View className="aspect-square rounded-full bg-surface" />
          <Text className="mt-5 text-center text-sm text-muted">
            Loading NASA images…
          </Text>
        </View>
      ) : vm.picture ? (
        <>
          <ObservatoryHero picture={vm.picture} />
          <ApodDetails picture={vm.picture} archive={vm.archive} />
        </>
      ) : (
        <View className="px-6 py-12">
          <Text className="font-display text-[22px] text-ink">
            No pictures available
          </Text>
          <Text className="mt-3 text-sm leading-6 text-muted">
            {vm.error ?? "NASA returned no images."}
          </Text>
        </View>
      )}
    </StarryScreen>
  );
}
