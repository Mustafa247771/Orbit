import { LinearGradient } from "expo-linear-gradient";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PointerEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  InteractiveStarField,
  StarPointer,
} from "@/components/ui/InteractiveStarField";

const LOCATIONS = ["Cairo, Egypt", "Alexandria, Egypt", "New Cairo, Egypt"];

type UpcomingPassProps = {
  day: string;
  time: string;
  direction: string;
  duration: string;
  elevation: string;
  quality: "Good" | "Fair";
};

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) =>
    String(value).padStart(2, "0"),
  );
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <View className="min-w-[52px] items-center">
      <Text
        className="text-[26px] font-semibold text-frost"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
      <Text className="mt-[2px] text-[7px] font-bold tracking-[1.2px] text-fog">
        {label}
      </Text>
    </View>
  );
}

function PassMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[18px] font-bold text-frost">{value}</Text>
      <Text className="mt-[6px] text-[8px] font-bold tracking-[1.3px] text-haze">
        {label}
      </Text>
    </View>
  );
}

function UpcomingPass({
  day,
  time,
  direction,
  duration,
  elevation,
  quality,
}: UpcomingPassProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day} at ${time}, ${duration} visible`}
      className="mx-[20px] mt-[12px] flex-row items-center rounded-[21px] border border-edge bg-panel/[0.48] p-[14px] active:scale-[0.985] active:opacity-[0.68]"
    >
      <View className="min-h-[66px] w-[78px] items-center justify-center rounded-[15px] border border-edge-strong bg-[#152238] px-[10px]">
        <Text className="text-[8px] font-extrabold tracking-[0.8px] text-cyan">
          {day}
        </Text>
        <Text className="mt-[6px] text-[14px] font-bold text-frost">
          {time}
        </Text>
      </View>

      <View className="ml-[14px] flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-[13px] font-bold text-frost">
            International Space Station
          </Text>
          <Text className="ml-[5px] text-[25px] text-cyan">›</Text>
        </View>
        <Text className="mt-[4px] text-[10px] text-haze">{direction}</Text>
        <View className="mt-[9px] flex-row flex-wrap items-center">
          <Text className="text-[9px] text-[#8FA0B8]">{duration} visible</Text>
          <View className="mx-[6px] h-[3px] w-[3px] rounded-[2px] bg-[#596A82]" />
          <Text className="text-[9px] text-[#8FA0B8]">
            {elevation} elevation
          </Text>
          <View
            className={`ml-[8px] rounded-[10px] px-[7px] py-[3px] ${quality === "Fair" ? "bg-gold/[0.12]" : "bg-mint/[0.12]"}`}
          >
            <Text
              className={`text-[8px] font-bold ${quality === "Fair" ? "text-gold" : "text-mint"}`}
            >
              {quality}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function VisiblePassesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [locationIndex, setLocationIndex] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [leadMinutes, setLeadMinutes] = useState(10);
  const [countdown, setCountdown] = useState(1 * 3600 + 18 * 60 + 32);
  const screenSize = useRef({ height: 1, width: 1 });
  const starPointer = useRef<StarPointer>({ active: false, x: 0.5, y: 0.5 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const [hours, minutes, seconds] = formatCountdown(countdown);

  function trackStars(event: GestureResponderEvent | PointerEvent) {
    const nativeEvent = event.nativeEvent;
    const locationX = nativeEvent.pageX;
    const locationY = nativeEvent.pageY;
    starPointer.current = {
      active: true,
      x: Math.max(0, Math.min(1, locationX / screenSize.current.width)),
      y: Math.max(0, Math.min(1, locationY / screenSize.current.height)),
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
      className="flex-1 bg-night"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 right-0 top-0"
      >
        <InteractiveStarField pointer={starPointer} />
      </View>
      <ScrollView
        className="flex-1 bg-transparent"
        contentContainerClassName="pb-[126px]"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-[20px] pt-[10px]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="h-[50px] w-[50px] items-center justify-center rounded-[25px] border border-edge-strong bg-panel/[0.9] active:scale-[0.985] active:opacity-[0.68]"
          >
            <Text className="-mt-[5px] text-[38px] font-extralight text-frost">
              ‹
            </Text>
          </Pressable>
          <View className="items-center">
            <Text className="text-[9px] font-extrabold tracking-[2.2px] text-haze">
              VISIBLE PASSES
            </Text>
            <Text className="mt-[4px] text-[15px] font-semibold text-frost">
              ISS · {id ?? "25544"}
            </Text>
          </View>
          <View className="h-[50px] w-[50px] items-center justify-center rounded-[25px] border border-edge-strong bg-panel/[0.9]">
            <View className="absolute right-[9px] top-[9px] h-[7px] w-[7px] rounded-[4px] bg-mint" />
            <Text className="-rotate-[25deg] text-[27px] text-cyan">⌁</Text>
          </View>
        </View>

        <View className="px-[24px] pt-[30px]">
          <Text className="text-[39px] font-bold leading-[43px] tracking-[-1.3px] text-frost">
            Your sky,{`\n`}tonight.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Observing location ${LOCATIONS[locationIndex]}. Change location`}
            onPress={() =>
              setLocationIndex((current) => (current + 1) % LOCATIONS.length)
            }
            className="mt-[17px] min-h-[45px] flex-row items-center self-start rounded-[22px] border border-edge-bright bg-panel/[0.72] px-[14px] active:scale-[0.985] active:opacity-[0.68]"
          >
            <Text className="mr-[8px] text-[22px] text-cyan">⌾</Text>
            <Text className="text-[13px] font-semibold text-frost">
              {LOCATIONS[locationIndex]}
            </Text>
            <Text className="ml-[9px] text-[15px] text-haze">⌄</Text>
          </Pressable>
        </View>

        <LinearGradient
          colors={["#162640", "#10192C", "#0C1424"]}
          locations={[0, 0.64, 1]}
          className="mx-[20px] mt-[22px] overflow-hidden rounded-[28px] border border-edge-strong p-[23px]"
        >
          <View className="absolute -right-[122px] -top-[90px] h-[245px] w-[245px] rotate-[18deg] rounded-[150px] border border-cyan/[0.22]" />
          <View className="absolute -right-[90px] -top-[58px] h-[180px] w-[180px] rounded-[110px] border border-violet/[0.16]" />
          <View className="absolute right-[42px] top-[75px] h-[28px] w-[47px] -rotate-[22deg]">
            <View className="absolute left-[19px] top-[5px] h-[18px] w-[9px] rounded-[4px] bg-frost" />
            <View className="absolute left-0 top-[7px] h-[13px] w-[15px] rounded-[2px] bg-cyan" />
            <View className="absolute right-0 top-[7px] h-[13px] w-[15px] rounded-[2px] bg-cyan" />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center rounded-[17px] border border-cyan/[0.45] bg-[rgba(22,82,82,0.55)] px-[12px] py-[8px]">
              <View className="mr-[7px] h-[7px] w-[7px] rounded-[4px] bg-mint" />
              <Text className="text-[9px] font-extrabold tracking-[1.1px] text-cyan">
                GOOD CONDITIONS
              </Text>
            </View>
            <Text className="text-[9px] font-bold tracking-[1.4px] text-haze">
              PREDICTED
            </Text>
          </View>

          <Text className="mt-[30px] text-[11px] font-bold tracking-[1.8px] text-haze">
            NEXT VISIBLE PASS
          </Text>
          <Text className="mt-[7px] text-[52px] font-semibold tracking-[-2px] text-frost">
            7:42{" "}
            <Text className="text-[19px] tracking-[0px] text-haze">PM</Text>
          </Text>
          <Text className="mt-[2px] text-[14px] text-haze">
            Tonight · Northwest → Southeast
          </Text>

          <View className="mt-[22px] rounded-[20px] border border-[rgba(64,86,117,0.55)] bg-night/[0.38] px-[18px] py-[15px]">
            <Text className="text-center text-[9px] font-extrabold tracking-[1.6px] text-haze">
              BEGINS IN
            </Text>
            <View className="mt-[8px] flex-row items-start justify-center">
              <CountdownUnit value={hours} label="HOURS" />
              <Text className="mx-[3px] mt-[2px] text-[22px] text-cyan">:</Text>
              <CountdownUnit value={minutes} label="MIN" />
              <Text className="mx-[3px] mt-[2px] text-[22px] text-cyan">:</Text>
              <CountdownUnit value={seconds} label="SEC" />
            </View>
          </View>

          <View className="mt-[23px] flex-row items-center justify-between">
            <PassMetric label="VISIBLE" value="6 min" />
            <View className="h-[35px] w-[1px] bg-edge" />
            <PassMetric label="MAX ELEV." value="64°" />
            <View className="h-[35px] w-[1px] bg-edge" />
            <PassMetric label="CLOUDS" value="12%" />
          </View>
        </LinearGradient>

        <View className="mx-[20px] mt-[16px] rounded-[24px] border border-edge bg-panel/[0.68] p-[18px]">
          <View className="flex-row items-center">
            <View className="mr-[11px] h-[36px] w-[36px] items-center justify-center rounded-[18px] bg-violet/[0.12]">
              <Text className="text-[23px] text-violet">♢</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-frost">
                Pass reminder
              </Text>
              <Text className="mt-[3px] text-[10px] text-haze">
                Alert me before the ISS becomes visible
              </Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: reminderEnabled }}
              accessibilityLabel="Pass reminder"
              onPress={() => setReminderEnabled((current) => !current)}
              className={`h-[30px] w-[52px] justify-center rounded-[16px] px-[3px] ${reminderEnabled ? "bg-teal" : "bg-edge-dim"}`}
            >
              <View
                className={`h-[24px] w-[24px] rounded-[12px] ${reminderEnabled ? "ml-[22px] bg-cyan" : "bg-mist"}`}
              />
            </Pressable>
          </View>

          {reminderEnabled && (
            <View className="mt-[16px] flex-row items-center border-t border-t-edge pt-[15px]">
              <Text className="flex-1 text-[8px] font-extrabold tracking-[1.3px] text-haze">
                REMIND ME
              </Text>
              {[5, 10, 20].map((minutesOption) => (
                <Pressable
                  key={minutesOption}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: leadMinutes === minutesOption,
                  }}
                  onPress={() => setLeadMinutes(minutesOption)}
                  className={`ml-[7px] rounded-[14px] border px-[10px] py-[7px] ${leadMinutes === minutesOption ? "border-cyan bg-cyan/[0.14]" : "border-edge"}`}
                >
                  <Text
                    className={`text-[10px] font-semibold ${leadMinutes === minutesOption ? "text-cyan" : "text-haze"}`}
                  >
                    {minutesOption} min
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View className="mx-[22px] mt-[31px] flex-row items-end justify-between">
          <View>
            <Text className="text-[9px] font-extrabold tracking-[1.7px] text-cyan">
              NEXT 7 DAYS
            </Text>
            <Text className="mt-[5px] text-[24px] font-bold text-frost">
              Coming into view
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pass filters"
          >
            <Text className="text-[12px] font-semibold text-cyan">
              Filter ≡
            </Text>
          </Pressable>
        </View>

        <UpcomingPass
          day="TOMORROW"
          time="5:18 AM"
          direction="West → Northeast"
          duration="4 min"
          elevation="42°"
          quality="Good"
        />
        <UpcomingPass
          day="WED 23"
          time="8:31 PM"
          direction="Southwest → East"
          duration="3 min"
          elevation="27°"
          quality="Fair"
        />
        <UpcomingPass
          day="FRI 25"
          time="6:54 PM"
          direction="Northwest → Southeast"
          duration="5 min"
          elevation="58°"
          quality="Good"
        />

        <View className="mx-[28px] mt-[20px] flex-row items-start">
          <Text className="mr-[9px] h-[18px] w-[18px] rounded-[9px] border border-[#52647E] text-center text-[10px] leading-[16px] text-haze">
            i
          </Text>
          <Text className="flex-1 text-[10px] leading-[15px] text-fog">
            Passes are optical predictions. Clear skies improve visibility but
            do not guarantee a sighting.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
