import { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Skeleton } from "@/components/ui/Skeleton";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { Tag } from "@/components/ui/Tag";
import { ArchiveStrip } from "../components/ArchiveStrip";
import { CollectionCard } from "../components/CollectionCard";
import { ExplanationCard } from "../components/ExplanationCard";
import { FullViewModal } from "../components/FullViewModal";
import { PictureActions } from "../components/PictureActions";
import { HERO_HEIGHT, PictureHero } from "../components/PictureHero";
import { useApodViewModel } from "../viewmodels/useApodViewModel";

export default function ApodScreen() {
  const vm = useApodViewModel();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const { picture } = vm;

  const header = (
    <ScreenHeader eyebrow="NASA" title="Picture of the day" floating />
  );

  const showFromArchive = (id: string) => {
    vm.select(id);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <StarryScreen edgeToEdge scrollY={scrollY} scrollRef={scrollRef}>
      {vm.loading ? (
        <View style={{ paddingTop: insets.top }}>
          {header}
          <View className="mx-5 mt-5 gap-3">
            <Skeleton height={HERO_HEIGHT - 120} radius={28} />
            <Skeleton width="45%" height={12} />
            <Skeleton height={30} />
            <Skeleton width="60%" height={30} />
          </View>
        </View>
      ) : !picture ? (
        <View style={{ paddingTop: insets.top }}>
          {header}
          <Card className="mx-5 mt-5 items-start gap-2 p-5">
            <Text className="text-[17px] font-semibold text-ink">
              No pictures right now
            </Text>
            <Text className="text-sm leading-5 text-muted">
              {vm.error ?? "NASA returned no pictures for today."}
            </Text>
            <Pressable
              onPress={vm.retry}
              accessibilityRole="button"
              className="mt-2 h-11 justify-center rounded-full border border-cyan/50 px-5 active:opacity-60"
            >
              <Text className="text-sm font-semibold text-cyan">Try again</Text>
            </Pressable>
          </Card>
        </View>
      ) : (
        <>
          <View>
            <PictureHero
              key={picture.id}
              picture={picture}
              scrollY={scrollY}
              onDoubleTap={() => vm.save(picture)}
            />
            <View
              className="absolute left-0 right-0"
              style={{ top: insets.top }}
            >
              {header}
            </View>
          </View>

          <PictureActions
            saved={vm.isSaved}
            onToggleSave={() => vm.toggleSave(picture)}
            onFullView={vm.openFullView}
            onShare={() => vm.share(picture)}
          />

          <View className="mt-6 items-start gap-3 px-5">
            <Tag
              label={
                vm.isPictureOfTheDay
                  ? vm.dateLabel
                  : `From the archive · ${picture.year}`
              }
            />
            <Text
              accessibilityRole="header"
              className="font-display text-[34px] leading-[38px] tracking-[-1px] text-ink"
            >
              {picture.title}
            </Text>
            <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
              {picture.credit} · {picture.year}
            </Text>
          </View>

          <ExplanationCard key={picture.id} text={picture.description} />

          {vm.archive.length > 0 && (
            <View className="mt-8">
              <View className="px-5">
                <SectionLabel title={`More ${vm.topic} from the archive`} />
              </View>
              <ArchiveStrip pictures={vm.archive} onSelect={showFromArchive} />
            </View>
          )}

          <CollectionCard saved={vm.saved} onPress={() => {}} />

          <FullViewModal
            picture={picture}
            visible={vm.fullView}
            onClose={vm.closeFullView}
          />
        </>
      )}

      <Text className="mx-5 mt-6 text-center font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
        Images · NASA Image and Video Library
      </Text>
    </StarryScreen>
  );
}
