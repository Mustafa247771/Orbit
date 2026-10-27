import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { StatRow } from "@/components/ui/StatRow";
import { AccountActions } from "../components/AccountActions";
import { AppSection } from "../components/AppSection";
import { NotificationsSection } from "../components/NotificationsSection";
import { ObservationSection } from "../components/ObservationSection";
import { ObservatorySection } from "../components/ObservatorySection";
import { ProfileHero } from "../components/ProfileHero";
import { useProfileViewModel } from "../viewmodels/useProfileViewModel";

const noop = () => {};

export default function ProfileScreen() {
  const vm = useProfileViewModel();

  return (
    <StarryScreen>
      <ScreenHeader
        action={{ icon: "edit", label: "Edit profile", onPress: noop }}
      />
      <ProfileHero
        profile={vm.profile}
        initials={vm.initials}
        still={vm.settings.reduceMotion}
        onChangePhoto={noop}
      />

      <Card className="mx-5 mt-6 px-2">
        <StatRow stats={vm.stats} />
      </Card>

      <ObservatorySection
        locations={vm.locations}
        onManage={noop}
        onAdd={noop}
      />
      <ObservationSection
        settings={vm.settings}
        onUpdate={vm.update}
        onChangeLeadTime={vm.changeLeadTime}
      />
      <NotificationsSection settings={vm.settings} onUpdate={vm.update} />
      <AppSection settings={vm.settings} onUpdate={vm.update} />
      <AccountActions version={vm.version} onSignOut={noop} onDelete={noop} />
    </StarryScreen>
  );
}
