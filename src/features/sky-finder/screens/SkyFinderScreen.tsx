import { Card } from "@/components/ui/Card";
import { Footnote } from "@/components/ui/Footnote";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingRow } from "@/components/ui/SettingRow";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { StatRow } from "@/components/ui/StatRow";
import { Toggle } from "@/components/ui/Toggle";
import { SkyCompass } from "../components/SkyCompass";
import { TargetBearings } from "../components/TargetBearings";
import { useSkyFinderViewModel } from "../viewmodels/useSkyFinderViewModel";

export default function SkyFinderScreen() {
  const vm = useSkyFinderViewModel();

  return (
    <StarryScreen>
      <ScreenHeader
        tone="cyan"
        eyebrow={`ISS · NORAD ${vm.noradId}`}
        title={"Find your\nmoving star."}
        subtitle="Hold your phone upright and follow the guide toward the International Space Station."
      />

      <SkyCompass
        pointerAngle={vm.pointerAngle}
        aligned={vm.aligned}
        guidance={vm.guidance}
        targetElevation={vm.target.elevation}
      />

      <Card className="mx-5 mt-6 px-2">
        <StatRow
          stats={[
            { label: "Your heading", value: vm.heading },
            { label: "Phone elevation", value: vm.elevation },
          ]}
        />
      </Card>

      <TargetBearings
        target={vm.target}
        statusLabel={vm.statusLabel}
        sensorsLive={vm.sensorsLive}
      />

      <Card className="mx-5 mt-4">
        <SettingRow
          label="Alignment vibration"
          hint="A single pulse when the ISS is centered"
          last
        >
          <Toggle
            label="Alignment vibration"
            value={vm.vibration}
            onChange={vm.setVibration}
          />
        </SettingRow>
      </Card>

      <Footnote>
        Keep awareness of your surroundings. Guidance is approximate and
        refreshes as your phone moves.
      </Footnote>
    </StarryScreen>
  );
}
