import {
  InteractiveStarField,
  StarPointer,
} from "@/components/ui/InteractiveStarField";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { DeviceMotion, Magnetometer } from "expo-sensors";
import { useEffect, useMemo, useRef, useState } from "react";
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
const TARGET_AZIMUTH = 312;
const TARGET_ELEVATION = 48;

type SensorState = "checking" | "active" | "unavailable" | "denied";

function normalizeAngle(value: number) {
  return ((value % 360) + 360) % 360;
}

function shortestAngle(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function cardinalDirection(heading: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(heading / 45) % directions.length];
}

export default function SkyFinderScreen() {
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [heading, setHeading] = useState(276);
  const [elevation, setElevation] = useState(34);
  const [sensorState, setSensorState] = useState<SensorState>("checking");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const wasAligned = useRef(false);

  useEffect(() => {
    let magnetometerSubscription: { remove: () => void } | undefined;
    let motionSubscription: { remove: () => void } | undefined;
    let mounted = true;

    async function startSensors() {
      try {
        const [magnetometerAvailable, motionAvailable] = await Promise.all([
          Magnetometer.isAvailableAsync(),
          DeviceMotion.isAvailableAsync(),
        ]);

        if (!mounted) return;
        if (!magnetometerAvailable || !motionAvailable) {
          setSensorState("unavailable");
          return;
        }

        const [magnetometerPermission, motionPermission] = await Promise.all([
          Magnetometer.requestPermissionsAsync(),
          DeviceMotion.requestPermissionsAsync(),
        ]);

        if (!mounted) return;
        if (!magnetometerPermission.granted || !motionPermission.granted) {
          setSensorState("denied");
          return;
        }

        Magnetometer.setUpdateInterval(120);
        DeviceMotion.setUpdateInterval(120);

        magnetometerSubscription = Magnetometer.addListener(({ x, y }) => {
          const calculatedHeading = normalizeAngle(
            Math.atan2(y, x) * (180 / Math.PI) - 90,
          );
          setHeading((current) => current * 0.82 + calculatedHeading * 0.18);
        });

        motionSubscription = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          const pitchDegrees = Math.abs(rotation.beta * (180 / Math.PI));
          const calculatedElevation = Math.max(
            0,
            Math.min(90, 90 - pitchDegrees),
          );
          setElevation((current) => current * 0.8 + calculatedElevation * 0.2);
        });

        setSensorState("active");
      } catch {
        if (mounted) setSensorState("unavailable");
      }
    }

    startSensors();

    return () => {
      mounted = false;
      magnetometerSubscription?.remove();
      motionSubscription?.remove();
    };
  }, []);

  const azimuthDifference = shortestAngle(heading, TARGET_AZIMUTH);
  const elevationDifference = TARGET_ELEVATION - elevation;
  const aligned =
    Math.abs(azimuthDifference) < 6 && Math.abs(elevationDifference) < 7;

  useEffect(() => {
    if (aligned && !wasAligned.current && hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
    wasAligned.current = aligned;
  }, [aligned, hapticsEnabled]);

  const guidance = useMemo(() => {
    if (sensorState === "checking") return "Calibrating your sky view…";
    if (sensorState === "denied")
      return "Sensor access is off — use the numeric bearings below";
    if (sensorState === "unavailable")
      return "Sensors unavailable — follow the numeric bearings";
    if (aligned) return "Target aligned — look up now";

    const turn =
      Math.abs(azimuthDifference) < 6
        ? "Hold this direction"
        : azimuthDifference > 0
          ? "Turn slowly right"
          : "Turn slowly left";
    const tilt =
      Math.abs(elevationDifference) < 7
        ? "keep your tilt"
        : elevationDifference > 0
          ? "tilt upward"
          : "tilt downward";

    return `${turn} and ${tilt}`;
  }, [aligned, azimuthDifference, elevationDifference, sensorState]);

  const statusText =
    sensorState === "active"
      ? "Sensors live"
      : sensorState === "checking"
        ? "Calibrating"
        : "Numeric mode";

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
      <LinearGradient
        colors={[
          "rgba(6,9,20,0.72)",
          "rgba(8,19,41,0.58)",
          "rgba(6,9,20,0.72)",
        ]}
        className="absolute inset-0"
      />
      <View className="absolute left-[12%] top-[18%] h-[3px] w-[3px] rounded-[3px] bg-ice opacity-[0.45]" />
      <View className="absolute left-[87%] top-[28%] h-[3px] w-[3px] rounded-[3px] bg-ice opacity-[0.45]" />
      <View className="absolute left-[70%] top-[9%] h-[3px] w-[3px] rounded-[3px] bg-ice opacity-[0.45]" />
      <View className="absolute left-[25%] top-[50%] h-[3px] w-[3px] rounded-[3px] bg-ice opacity-[0.45]" />
      <View className="absolute left-[91%] top-[63%] h-[3px] w-[3px] rounded-[3px] bg-ice opacity-[0.45]" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-[42px]"
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
            <Text className="text-[9px] font-extrabold tracking-[2.1px] text-haze">
              GUIDED VIEW
            </Text>
            <Text className="mt-[4px] text-[16px] font-semibold text-frost">
              Sky Finder
            </Text>
          </View>

          <View className="h-[50px] w-[50px] items-center justify-center rounded-[25px] border border-edge-strong bg-panel/[0.9]">
            <View
              className={`absolute right-[9px] top-[9px] h-[7px] w-[7px] rounded-[4px] ${sensorState !== "active" ? "bg-gold" : "bg-mint"}`}
            />
            <Text className="-rotate-[25deg] text-[27px] text-cyan">⌁</Text>
          </View>
        </View>

        <View className="px-[24px] pt-[28px]">
          <Text className="text-[10px] font-extrabold tracking-[2px] text-cyan">
            ISS · NORAD {id ?? "25544"}
          </Text>
          <Text className="mt-[12px] text-[39px] font-bold leading-[43px] tracking-[-1.3px] text-frost">
            Find your{`\n`}moving star.
          </Text>
          <Text className="mt-[12px] max-w-[340px] text-[14px] leading-[21px] text-haze">
            Hold your phone upright and follow the guide toward the
            International Space Station.
          </Text>
        </View>

        <View className="mt-[8px] h-[390px] items-center justify-center">
          <View className="absolute h-[360px] w-[360px] rounded-[180px] bg-cyan/[0.06]" />
          <View className="h-[290px] w-[290px] items-center justify-center rounded-[145px] border border-edge-bright">
            <View className="h-[210px] w-[210px] items-center justify-center rounded-[105px] border border-dashed border-cyan/[0.26]">
              <View className="h-[122px] w-[122px] items-center justify-center overflow-hidden rounded-[61px] border border-edge-bright">
                <View className="absolute h-[1px] w-full bg-cyan/[0.32]" />
                <View className="absolute h-full w-[1px] bg-cyan/[0.32]" />
                <View className="h-[20px] w-[20px] items-center justify-center rounded-[10px] border-[2px] border-cyan">
                  <View className="h-[6px] w-[6px] rounded-[3px] bg-cyan" />
                </View>
              </View>
            </View>

            <Text className="absolute top-[10px] text-[12px] font-bold text-haze">
              N
            </Text>
            <Text className="absolute right-[12px] text-[12px] font-bold text-haze">
              E
            </Text>
            <Text className="absolute bottom-[10px] text-[12px] font-bold text-haze">
              S
            </Text>
            <Text className="absolute left-[11px] text-[12px] font-bold text-haze">
              W
            </Text>

            <View
              className="absolute h-[235px] w-[4px]"
              style={{ transform: [{ rotate: `${azimuthDifference}deg` }] }}
            >
              <View className="absolute -left-[20px] -top-[8px] h-[34px] w-[44px]">
                <View className="absolute left-[18px] top-[6px] h-[22px] w-[8px] rounded-[3px] bg-frost" />
                <View className="absolute left-0 top-[10px] h-[14px] w-[15px] rounded-[2px] bg-cyan" />
                <View className="absolute right-0 top-[10px] h-[14px] w-[15px] rounded-[2px] bg-cyan" />
              </View>
            </View>

            <View
              className="absolute h-[95px] w-[36px] items-center justify-start"
              style={{
                transform: [
                  {
                    rotate: `${Math.max(-70, Math.min(70, azimuthDifference))}deg`,
                  },
                ],
              }}
            >
              <Text
                className={`text-[49px] font-extralight ${aligned ? "text-mint [text-shadow:0px_0px_12px_rgba(124,243,197,0.75)]" : "text-cyan [text-shadow:0px_0px_12px_rgba(120,230,255,0.55)]"}`}
              >
                ↑
              </Text>
            </View>
          </View>

          <View className="absolute bottom-[18px] items-center rounded-[17px] border border-cyan/[0.45] bg-[rgba(11,24,42,0.92)] px-[16px] py-[8px]">
            <Text className="text-[7px] font-extrabold tracking-[1.4px] text-mist">
              TARGET
            </Text>
            <Text className="mt-[2px] text-[11px] font-bold text-cyan">
              ISS / {TARGET_ELEVATION}°
            </Text>
          </View>
        </View>

        <View
          className={`-mt-[8px] max-w-[88%] flex-row items-center self-center rounded-[22px] border px-[16px] py-[11px] ${aligned ? "border-mint/[0.68] bg-[rgba(26,83,70,0.78)]" : "border-cyan/[0.48] bg-[rgba(22,67,83,0.7)]"}`}
        >
          <View
            className={`mr-[9px] h-[7px] w-[7px] rounded-[4px] ${aligned ? "bg-mint" : "bg-cyan"}`}
          />
          <Text
            className={`text-[12px] font-semibold ${aligned ? "text-mint" : "text-cyan"}`}
          >
            {guidance}
          </Text>
        </View>

        <View className="mx-[20px] mt-[18px] flex-row rounded-[22px] border border-edge bg-panel/[0.75] py-[19px]">
          <View className="flex-1 items-center">
            <Text className="text-[8px] font-extrabold tracking-[1.2px] text-mist">
              YOUR HEADING
            </Text>
            <Text
              className="mt-[7px] text-[22px] font-bold text-frost"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {Math.round(normalizeAngle(heading))}°{" "}
              <Text className="text-[12px] text-cyan">
                {cardinalDirection(heading)}
              </Text>
            </Text>
          </View>
          <View className="w-[1px] bg-edge" />
          <View className="flex-1 items-center">
            <Text className="text-[8px] font-extrabold tracking-[1.2px] text-mist">
              PHONE ELEVATION
            </Text>
            <Text
              className="mt-[7px] text-[22px] font-bold text-frost"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {Math.round(elevation)}°{" "}
              <Text className="text-[12px] text-cyan">UP</Text>
            </Text>
          </View>
        </View>

        <View className="mx-[20px] mt-[12px] rounded-[22px] border border-edge bg-panel/[0.55] p-[18px]">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[8px] font-extrabold tracking-[1.4px] text-mist">
                NUMERIC FALLBACK
              </Text>
              <Text className="mt-[4px] text-[16px] font-bold text-frost">
                Target bearings
              </Text>
            </View>
            <View className="flex-row items-center rounded-[12px] bg-cyan/[0.08] px-[9px] py-[6px]">
              <View
                className={`mr-[6px] h-[6px] w-[6px] rounded-[3px] ${sensorState !== "active" ? "bg-gold" : "bg-mint"}`}
              />
              <Text className="text-[9px] font-semibold text-haze">
                {statusText}
              </Text>
            </View>
          </View>
          <View className="mt-[19px] flex-row items-center justify-between">
            <View>
              <Text className="text-[17px] font-bold text-frost">312° NW</Text>
              <Text className="mt-[5px] text-[7px] font-extrabold tracking-[1.1px] text-mist">
                AZIMUTH
              </Text>
            </View>
            <View className="h-[36px] w-[1px] bg-edge" />
            <View>
              <Text className="text-[17px] font-bold text-frost">48°</Text>
              <Text className="mt-[5px] text-[7px] font-extrabold tracking-[1.1px] text-mist">
                ELEVATION
              </Text>
            </View>
            <View className="h-[36px] w-[1px] bg-edge" />
            <View>
              <Text className="text-[17px] font-bold text-frost">6 min</Text>
              <Text className="mt-[5px] text-[7px] font-extrabold tracking-[1.1px] text-mist">
                VISIBLE
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: hapticsEnabled }}
          accessibilityLabel="Alignment vibration"
          onPress={() => setHapticsEnabled((current) => !current)}
          className="mx-[20px] mt-[12px] flex-row items-center rounded-[20px] border border-edge bg-panel/[0.48] p-[15px] active:scale-[0.985] active:opacity-[0.68]"
        >
          <View className="mr-[11px] h-[34px] w-[34px] items-center justify-center rounded-[16px] bg-violet/[0.12]">
            <Text className="rotate-[90deg] text-[22px] text-violet">≈</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-bold text-frost">
              Alignment vibration
            </Text>
            <Text className="mt-[3px] text-[9px] text-mist">
              A single pulse when the ISS is centered
            </Text>
          </View>
          <View
            className={`h-[29px] w-[50px] justify-center rounded-[15px] px-[3px] ${hapticsEnabled ? "bg-teal" : "bg-edge-dim"}`}
          >
            <View
              className={`h-[23px] w-[23px] rounded-[12px] ${hapticsEnabled ? "ml-[21px] bg-cyan" : "bg-mist"}`}
            />
          </View>
        </Pressable>

        <Text className="mx-[34px] mt-[15px] text-center text-[9px] leading-[14px] text-dusk">
          Keep awareness of your surroundings. Guidance is approximate and
          refreshes as your phone moves.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
