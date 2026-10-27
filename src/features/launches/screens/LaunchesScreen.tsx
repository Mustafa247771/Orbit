import { RefreshControl, View } from "react-native";

import { Footnote } from "@/components/ui/Footnote";
import { Label } from "@/components/ui/Label";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { StateMessage } from "@/components/ui/StateMessage";
import { Tag } from "@/components/ui/Tag";
import colors from "@/theme/colors";
import { FeaturedLaunch } from "../components/FeaturedLaunch";
import { LaunchRow } from "../components/LaunchRow";
import { useLaunchesViewModel } from "../viewmodels/useLaunchesViewModel";

export default function LaunchesScreen() {
  const vm = useLaunchesViewModel();

  return (
    <StarryScreen
      refreshControl={
        <RefreshControl
          refreshing={vm.refreshing}
          onRefresh={vm.refresh}
          tintColor={colors.cyan}
        />
      }
    >
      <ScreenHeader
        tone="cyan"
        eyebrow="Mission control"
        title={"The next\nignition."}
        action={{
          icon: "refresh",
          label: "Refresh launches",
          onPress: vm.refresh,
        }}
      >
        <Tag
          dot
          label={vm.live ? "Live data" : "Cached data"}
          tone={vm.live ? "accent" : "gold"}
        />
      </ScreenHeader>

      {vm.loading ? (
        <StateMessage loading message="Contacting launch control…" />
      ) : vm.featured ? (
        <FeaturedLaunch launch={vm.featured} />
      ) : (
        <StateMessage
          title="Launch data unavailable"
          message={vm.error}
          onRetry={vm.refresh}
        />
      )}

      {vm.error && vm.featured ? (
        <Label tone="gold" className="mx-5 mt-3 text-center">
          Showing saved data · pull down to retry
        </Label>
      ) : null}

      {vm.upcoming.length > 0 && (
        <View className="mx-5 mt-8">
          <SectionLabel title={`Upcoming · ${vm.upcoming.length} scheduled`} />
          {vm.upcoming.map((launch, index) => (
            <LaunchRow
              key={launch.id}
              launch={launch}
              last={index === vm.upcoming.length - 1}
            />
          ))}
        </View>
      )}

      <Footnote>
        Launch data from The Space Devs · times in your local timezone
      </Footnote>
    </StarryScreen>
  );
}
