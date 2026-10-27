import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { StateMessage } from "@/components/ui/StateMessage";
import { ApodDetails } from "../components/ApodDetails";
import { ObservatoryHero } from "../components/ObservatoryHero";
import { WeekStrip } from "../components/WeekStrip";
import { useApodViewModel } from "../viewmodels/useApodViewModel";

const noop = () => {};

export default function ApodScreen() {
  const vm = useApodViewModel();

  return (
    <StarryScreen>
      <ScreenHeader
        tone="cyan"
        eyebrow="Astronomy picture of the day"
        title="APOD"
        action={{ icon: "bookmark", label: "Saved pictures", onPress: noop }}
      />
      <WeekStrip month={vm.month} year={vm.year} days={vm.days} />

      {vm.loading ? (
        <StateMessage loading message="Loading NASA images…" />
      ) : vm.picture ? (
        <>
          <ObservatoryHero picture={vm.picture} />
          <ApodDetails picture={vm.picture} archive={vm.archive} />
        </>
      ) : (
        <StateMessage
          title="No pictures available"
          message={vm.error ?? "NASA returned no images."}
          onRetry={vm.retry}
        />
      )}
    </StarryScreen>
  );
}
