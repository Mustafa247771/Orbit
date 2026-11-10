import { useRef } from "react";
import { RefreshControl } from "react-native";
import type Animated from "react-native-reanimated";

import { Footnote } from "@/components/ui/Footnote";
import { FormMessage } from "@/components/ui/FormMessage";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { StateMessage } from "@/components/ui/StateMessage";
import colors from "@/theme/colors";
import { ApodDatePickerSheet } from "../components/ApodDatePickerSheet";
import { ApodDetails } from "../components/ApodDetails";
import { ApodSavedSheet } from "../components/ApodSavedSheet";
import { ApodViewer } from "../components/ApodViewer";
import { ObservatoryHero } from "../components/ObservatoryHero";
import { WeekStrip } from "../components/WeekStrip";
import { useApodViewModel } from "../viewmodels/useApodViewModel";

export default function ApodScreen() {
  const vm = useApodViewModel();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const { entry } = vm.hero;

  const showDay = (date: string) => {
    vm.details.onSelectDay(date);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <>
      <StarryScreen
        scrollRef={scrollRef}
        refreshControl={
          <RefreshControl
            refreshing={vm.refresh.refreshing}
            onRefresh={vm.refresh.onRefresh}
            tintColor={colors.cyan}
            colors={[colors.cyan]}
          />
        }
      >
        <ScreenHeader
          tone="cyan"
          eyebrow="Astronomy picture of the day"
          title="APOD"
          action={{ icon: "bookmark", label: "Saved pictures", onPress: vm.openSaved }}
        />
        <WeekStrip {...vm.strip} />
        <FormMessage className="mx-5 mt-3">{vm.notices.date}</FormMessage>

        {entry || vm.status.loading ? (
          <>
            <FormMessage tone="gold" className="mx-5 mt-3">
              {vm.notices.fallback}
            </FormMessage>
            <FormMessage tone="gold" className="mx-5 mt-3">
              {vm.notices.cached}
            </FormMessage>
            <ObservatoryHero {...vm.hero} />
            <FormMessage className="mx-5 mt-3">{vm.notices.action}</FormMessage>
            <FormMessage className="mx-5 mt-3">{vm.notices.favorites}</FormMessage>
            <FormMessage tone="gold" className="mx-5 mt-3">
              {vm.notices.favoritesSoft}
            </FormMessage>
            {entry ? (
              <ApodDetails entry={entry} {...vm.details} onSelectDay={showDay} />
            ) : null}
          </>
        ) : (
          <StateMessage
            title="Couldn't load the picture"
            message={vm.status.error}
            onRetry={vm.status.retry}
          />
        )}

        <Footnote>
          {vm.demoKey
            ? "Images: NASA Astronomy Picture of the Day. Adding a NASA API key avoids rate limits."
            : "Images: NASA Astronomy Picture of the Day"}
        </Footnote>
      </StarryScreen>

      <ApodViewer {...vm.viewer} />
      <ApodDatePickerSheet {...vm.picker} />
      <ApodSavedSheet {...vm.saved} />
    </>
  );
}
