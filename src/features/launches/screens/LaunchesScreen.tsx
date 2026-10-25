import {
  InteractiveStarField,
  StarPointer,
} from "@/components/ui/InteractiveStarField";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  PointerEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import colors from "@/theme/colors";

import type { Launch } from "@/features/launches/model/Launch";
import {
  launchCountdown,
  useLaunchCalendarViewModel,
} from "@/features/launches/viewmodels/useLaunchCalendarViewModel";

function Countdown({ launch, now }: { launch: Launch; now: number }) {
  const countdown = launchCountdown(launch.net, now);
  return (
    <View className="mt-[19px] flex-row items-start">
      {[
        [countdown.days, "DAYS"],
        [countdown.hours, "HRS"],
        [countdown.minutes, "MIN"],
        [countdown.seconds, "SEC"],
      ].map(([value, label], index) => (
        <View key={label} className="relative min-w-[60px] items-center">
          {index > 0 && (
            <Text className="absolute -left-[4px] top-[1px] text-[24px] text-cyan">
              :
            </Text>
          )}
          <Text
            className="text-[27px] font-medium text-frost"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {String(value).padStart(2, "0")}
          </Text>
          <Text className="mt-[2px] text-[6px] font-extrabold tracking-[1.2px] text-dusk">
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function LaunchCard({ launch, now }: { launch: Launch; now: number }) {
  const countdown = launchCountdown(launch.net, now);
  const date = new Date(launch.net);
  return (
    <View className="mb-[11px] min-h-[128px] flex-row overflow-hidden rounded-[22px] border border-edge bg-panel/[0.76]">
      <View className="w-[82px] items-center justify-center bg-[rgba(26,48,78,0.9)]">
        <Text className="text-[8px] font-black tracking-[1.3px] text-cyan">
          {date.toLocaleDateString([], { month: "short" }).toUpperCase()}
        </Text>
        <Text className="mt-[2px] text-[30px] font-bold text-frost">
          {date.getDate()}
        </Text>
        <Text className="mt-[3px] text-[8px] text-haze">
          {date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </Text>
      </View>
      <View className="flex-1 p-[14px]">
        <View className="flex-row items-center justify-between">
          <Text
            numberOfLines={1}
            className="mr-[8px] flex-1 text-[8px] font-bold uppercase text-mist"
          >
            {launch.provider}
          </Text>
          <View className="rounded-[10px] border border-mint/[0.3] bg-mint/[0.09] px-[7px] py-[3px]">
            <Text className="text-[6px] font-black text-mint">
              {launch.statusAbbreviation}
            </Text>
          </View>
        </View>
        <Text
          numberOfLines={2}
          className="mt-[7px] text-[13px] font-bold leading-[17px] text-frost"
        >
          {launch.name}
        </Text>
        <Text numberOfLines={1} className="mt-[6px] text-[8px] text-mist">
          ⌖ {launch.location}
        </Text>
        <Text
          className="mt-[8px] text-[9px] font-extrabold text-cyan"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          T− {countdown.days}d {String(countdown.hours).padStart(2, "0")}h{" "}
          {String(countdown.minutes).padStart(2, "0")}m
        </Text>
      </View>
    </View>
  );
}

export default function LaunchCalendarScreen() {
  const viewModel = useLaunchCalendarViewModel();
  const featured = viewModel.featuredLaunch;
  const screenSize = useRef({ height: 1, width: 1 });

  const starPointer = useRef<StarPointer>({
    active: false,
    x: 0.5,
    y: 0.5,
  });

  function trackStars(event: GestureResponderEvent | PointerEvent) {
    const { pageX, pageY } = event.nativeEvent;

    starPointer.current = {
      active: true,
      x: Math.max(0, Math.min(1, pageX / screenSize.current.width)),
      y: Math.max(0, Math.min(1, pageY / screenSize.current.height)),
    };
  }

  function releaseStars() {
    starPointer.current.active = false;
  }

  function measureScreen(event: LayoutChangeEvent) {
    screenSize.current = event.nativeEvent.layout;
  }
  return (
    <SafeAreaView
      onLayout={measureScreen}
      onPointerLeave={releaseStars}
      onPointerMove={trackStars}
      onTouchEnd={releaseStars}
      onTouchMove={trackStars}
      onTouchStart={trackStars}
      className="flex-1 bg-transparent"
    >
      <View pointerEvents="none" className="absolute inset-0">
        <InteractiveStarField pointer={starPointer} />
      </View>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerClassName="pb-[130px]"
        refreshControl={
          <RefreshControl
            onRefresh={viewModel.refresh}
            refreshing={viewModel.refreshing}
            tintColor={colors.cyan}
          />
        }
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-[20px] pt-[10px]">
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            className="h-[50px] w-[50px] items-center justify-center rounded-[25px] border border-edge-strong bg-panel/[0.92]"
          >
            <Text className="-mt-[5px] text-[38px] font-extralight text-frost">
              ‹
            </Text>
          </Pressable>
          <View className="items-center">
            <Text className="text-[8px] font-extrabold tracking-[1.8px] text-haze">
              MISSION CONTROL
            </Text>
            <Text className="mt-[4px] text-[16px] font-semibold text-frost">
              Launch calendar
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Refresh launches"
            accessibilityRole="button"
            onPress={viewModel.refresh}
            className="h-[50px] w-[50px] items-center justify-center rounded-[25px] border border-edge-strong bg-panel/[0.92]"
          >
            <Text className="text-[25px] text-cyan">↻</Text>
          </Pressable>
        </View>

        <View className="px-[24px] pt-[28px]">
          <Text className="text-[43px] font-bold leading-[45px] tracking-[-1.5px] text-frost">
            The next{`\n`}ignition.
          </Text>
          <View className="mt-[15px] flex-row items-center">
            <View
              className={`mr-[8px] h-[7px] w-[7px] rounded-[4px] ${viewModel.source === "cache" ? "bg-gold" : "bg-mint"}`}
            />
            <Text className="text-[9px] font-extrabold tracking-[1.5px] text-cyan">
              {viewModel.source === "live"
                ? "LIVE LAUNCH DATA"
                : "CACHED LAUNCH DATA"}
            </Text>
          </View>
        </View>

        {viewModel.loading ? (
          <View className="mx-[20px] mt-[24px] h-[390px] items-center justify-center rounded-[28px] border border-edge bg-panel">
            <ActivityIndicator color={colors.cyan} size="large" />
            <Text className="mt-[15px] text-[12px] text-haze">
              Contacting launch control…
            </Text>
          </View>
        ) : featured ? (
          <View className="mx-[20px] mt-[24px] h-[500px] overflow-hidden rounded-[30px] border border-[#304866]">
            {featured.imageUrl ? (
              <Image
                resizeMode="cover"
                source={{ uri: featured.imageUrl }}
                className="absolute inset-0"
              />
            ) : (
              <View className="flex-1 bg-[#122D55]" />
            )}
            <LinearGradient
              colors={["rgba(4,8,18,0.08)", "rgba(6,9,20,0.82)", "#08101E"]}
              locations={[0, 0.52, 1]}
              className="absolute inset-0"
            />
            <View className="absolute -right-[100px] top-[60px] h-[250px] w-[320px] -rotate-[28deg] rounded-[160px] border border-cyan/[0.35]" />
            <View className="flex-row items-center justify-between p-[20px]">
              <View className="flex-row items-center rounded-[18px] border border-mint/[0.5] bg-[rgba(7,29,35,0.86)] px-[11px] py-[8px]">
                <View className="mr-[7px] h-[6px] w-[6px] rounded-[3px] bg-mint" />
                <Text className="text-[8px] font-black tracking-[1px] text-mint">
                  {featured.status.toUpperCase()}
                </Text>
              </View>
              <Text className="max-w-[145px] text-right text-[9px] font-bold text-pale">
                {featured.provider}
              </Text>
            </View>
            <View className="mt-auto p-[22px]">
              <Text className="text-[8px] font-black tracking-[1.7px] text-haze">
                NEXT SCHEDULED LAUNCH
              </Text>
              <Text
                numberOfLines={3}
                className="mt-[8px] text-[27px] font-extrabold leading-[31px] tracking-[-0.7px] text-frost"
              >
                {featured.name}
              </Text>
              <Text className="mt-[9px] text-[10px] text-haze">
                {featured.rocket} · {featured.location}
              </Text>
              <Countdown launch={featured} now={viewModel.now} />
              <View className="mt-[20px] h-[1px] bg-edge-soft" />
              <View className="mt-[15px] flex-row justify-between">
                <View>
                  <Text className="text-[7px] font-black tracking-[1.2px] text-dusk">
                    TARGET TIME
                  </Text>
                  <Text className="mt-[5px] text-[10px] font-semibold text-pale">
                    {new Date(featured.net).toLocaleString([], {
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      month: "short",
                    })}
                  </Text>
                </View>
                <View className="max-w-[48%] items-end">
                  <Text className="text-[7px] font-black tracking-[1.2px] text-dusk">
                    MISSION
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-[5px] text-[10px] font-semibold text-pale"
                  >
                    {featured.missionType}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View className="mx-[20px] mt-[24px] items-center rounded-[26px] border border-[#394B67] bg-panel p-[28px]">
            <Text className="text-[18px] font-bold text-frost">
              Launch data unavailable
            </Text>
            <Text className="mt-[8px] text-center text-[11px] leading-[17px] text-haze">
              {viewModel.error}
            </Text>
            <Pressable
              onPress={viewModel.refresh}
              className="mt-[18px] rounded-[17px] bg-cyan px-[22px] py-[11px]"
            >
              <Text className="text-[11px] font-extrabold text-deep">
                Try again
              </Text>
            </Pressable>
          </View>
        )}

        {viewModel.error && featured && (
          <Text className="mx-[24px] mt-[12px] text-center text-[9px] text-gold">
            Showing saved launch data · Pull down to retry
          </Text>
        )}

        {viewModel.launches.length > 1 && (
          <View className="mt-[28px] px-[20px]">
            <View className="mb-[12px] flex-row items-center justify-between">
              <Text className="text-[9px] font-black tracking-[1.7px] text-haze">
                UPCOMING MISSIONS
              </Text>
              <Text className="text-[9px] text-dusk">
                {viewModel.launches.length - 1} scheduled
              </Text>
            </View>
            {viewModel.launches.slice(1).map((launch) => (
              <LaunchCard key={launch.id} launch={launch} now={viewModel.now} />
            ))}
          </View>
        )}

        <Text className="mx-[40px] mt-[20px] text-center text-[8px] leading-[13px] text-[#5F6D83]">
          Launch data provided by The Space Devs · Times shown in your local
          timezone
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
