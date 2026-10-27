import { View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Footnote } from "@/components/ui/Footnote";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { NextPassCard } from "../components/NextPassCard";
import { PassReminder } from "../components/PassReminder";
import { PassRow } from "../components/PassRow";
import { usePassesViewModel } from "../viewmodels/usePassesViewModel";

const noop = () => {};

export default function PassesScreen() {
  const vm = usePassesViewModel();

  return (
    <StarryScreen>
      <ScreenHeader
        tone="cyan"
        eyebrow={`ISS · NORAD ${vm.noradId}`}
        title={"Your sky,\ntonight."}
      >
        <Button
          label={vm.location}
          icon="location"
          variant="outline"
          tone="cyan"
          onPress={vm.nextLocation}
        />
      </ScreenHeader>

      <NextPassCard pass={vm.nextPass} secondsLeft={vm.secondsLeft} />
      <PassReminder
        enabled={vm.reminder}
        leadTime={vm.leadTime}
        onToggle={vm.setReminder}
        onLeadTimeChange={vm.setLeadTime}
      />

      <View className="mx-5 mt-8">
        <SectionLabel
          title="Next 7 days"
          action={{ label: "Filter", onPress: noop }}
        />
        {vm.upcoming.map((pass, index) => (
          <PassRow
            key={pass.id}
            pass={pass}
            last={index === vm.upcoming.length - 1}
          />
        ))}
      </View>

      <Footnote>
        Passes are optical predictions. Clear skies improve visibility but do
        not guarantee a sighting.
      </Footnote>
    </StarryScreen>
  );
}
