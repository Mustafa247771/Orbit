import {
  InteractiveStarField,
  StarPointer,
} from "@/components/ui/InteractiveStarField";
import { SatelliteScene } from "@/features/satellites/components/SatelliteScene";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
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

function TelemetryItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View className="w-[31%]">
      <Text className="text-[9px] font-bold tracking-[1.2px] text-haze">
        {label}
      </Text>
      <View className="mt-[6px] flex-row items-baseline">
        <Text className="text-[25px] font-bold text-frost">{value}</Text>
        <Text className="ml-[4px] text-[10px] text-haze">{unit}</Text>
      </View>
    </View>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-[5px]">
      <Text className="text-[13px] text-haze">{label}</Text>
      <Text className="text-[13px] font-semibold text-frost">{value}</Text>
    </View>
  );
}

export default function SatelliteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [paused, setPaused] = useState(false);
  const rotation = useRef({ x: 0.22, y: -0.5 });
  const dragStart = useRef({ pageX: 0, pageY: 0, rotationX: 0, rotationY: 0 });
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
        className="flex-1 bg-transparent"
        contentContainerClassName="pb-[126px]"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-[20px] pt-[10px]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="h-[50px] w-[50px] items-center justify-center rounded-[25px] border border-edge-strong bg-panel/[0.9] active:scale-[0.98] active:opacity-[0.65]"
          >
            <Text className="-mt-[5px] text-[38px] font-extralight text-frost">
              ‹
            </Text>
          </Pressable>

          <View className="items-center">
            <Text className="text-[10px] font-bold tracking-[2.2px] text-haze">
              ORBITAL OBJECT
            </Text>
            <Text className="mt-[3px] text-[16px] font-semibold text-frost">
              Satellite details
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add ISS to tracked objects"
            className="h-[50px] w-[50px] items-center justify-center rounded-[25px] border border-edge-strong bg-panel/[0.9] active:scale-[0.98] active:opacity-[0.65]"
          >
            <Text className="text-[27px] font-light text-cyan">＋</Text>
          </Pressable>
        </View>

        <View className="z-[2] px-[26px] pt-[30px]">
          <View className="mb-[13px] flex-row items-center">
            <View className="mr-[8px] h-[7px] w-[7px] rounded-[4px] bg-mint" />
            <Text className="text-[11px] font-bold tracking-[1.8px] text-mint">
              LIVE TELEMETRY
            </Text>
          </View>
          <Text className="text-[38px] font-bold leading-[42px] tracking-[-1.35px] text-frost">
            International{`\n`}Space Station
          </Text>
          <Text className="mt-[10px] text-[14px] tracking-[0.4px] text-haze">
            ISS · NORAD {id ?? "25544"}
          </Text>
        </View>

        <View
          className="-mt-[15px] h-[380px] overflow-hidden"
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => {
            dragStart.current = {
              pageX: event.nativeEvent.pageX,
              pageY: event.nativeEvent.pageY,
              rotationX: rotation.current.x,
              rotationY: rotation.current.y,
            };
          }}
          onResponderMove={(event) => {
            const deltaX = event.nativeEvent.pageX - dragStart.current.pageX;
            const deltaY = event.nativeEvent.pageY - dragStart.current.pageY;
            rotation.current.y = dragStart.current.rotationY + deltaX * 0.009;
            rotation.current.x = Math.max(
              -0.8,
              Math.min(0.8, dragStart.current.rotationX + deltaY * 0.007),
            );
          }}
        >
          <SatelliteScene rotation={rotation} paused={paused} />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(6,9,20,0)", "rgba(6,9,20,0.88)"]}
            locations={[0.56, 1]}
            className="absolute inset-0"
          />

          <View
            className="absolute left-[24px] right-[24px] top-[35px] flex-row justify-between"
            pointerEvents="box-none"
          >
            <View className="rounded-[18px] border border-cyan/[0.35] bg-shade/[0.75] px-[13px] py-[8px]">
              <Text className="text-[10px] font-bold tracking-[1.5px] text-cyan">
                3D ORBIT VIEW
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                paused ? "Resume 3D rotation" : "Pause 3D rotation"
              }
              onPress={() => setPaused((current) => !current)}
              className="h-[38px] w-[38px] items-center justify-center rounded-[19px] border border-edge-strong bg-shade/[0.78] active:scale-[0.98] active:opacity-[0.65]"
            >
              <Text className="text-[13px] font-bold text-frost">
                {paused ? "▶" : "Ⅱ"}
              </Text>
            </Pressable>
          </View>

          <View
            className="absolute bottom-[23px] left-[28px] flex-row items-center"
            pointerEvents="none"
          >
            <View className="mr-[9px] h-[28px] w-[28px] items-center justify-center rounded-[14px] border border-cyan/[0.45]">
              <Text className="text-[15px] text-cyan">↔</Text>
            </View>
            <Text className="text-[12px] text-haze">Drag to rotate</Text>
          </View>
        </View>

        <LinearGradient
          colors={["rgba(25,42,68,0.96)", "rgba(13,22,39,0.98)"]}
          className="mx-[20px] -mt-[14px] overflow-hidden rounded-[28px] border border-edge-soft p-[24px]"
        >
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-[11px] font-bold tracking-[1.8px] text-haze">
                CURRENT FLIGHT
              </Text>
              <Text className="mt-[7px] text-[20px] font-bold text-frost">
                Moving above the horizon
              </Text>
            </View>
            <View className="flex-row items-center rounded-[14px] border border-mint/[0.35] bg-[rgba(31,78,76,0.44)] px-[10px] py-[6px]">
              <View className="mr-[6px] h-[6px] w-[6px] rounded-[3px] bg-mint" />
              <Text className="text-[9px] font-extrabold tracking-[1px] text-mint">
                FRESH
              </Text>
            </View>
          </View>

          <View className="mt-[25px] flex-row justify-between">
            <TelemetryItem label="ALTITUDE" value="420" unit="km" />
            <TelemetryItem label="SPEED" value="27.6" unit="k km/h" />
            <TelemetryItem label="VISIBILITY" value="6" unit="min" />
          </View>

          <View className="my-[20px] h-[1px] bg-edge" />
          <DataRow label="Latitude" value="23.416° N" />
          <DataRow label="Longitude" value="31.235° E" />
          <DataRow label="Last updated" value="8 seconds ago" />
        </LinearGradient>

        <View className="mx-[20px] mt-[18px] overflow-hidden rounded-[25px] border border-edge bg-panel/[0.74] p-[23px]">
          <View className="absolute -right-[75px] -top-[74px] h-[165px] w-[165px] rounded-[100px] border border-cyan/[0.18]" />
          <Text className="text-[11px] font-bold tracking-[1.8px] text-haze">
            NEXT VISIBLE PASS · CAIRO
          </Text>
          <View className="mt-[15px] flex-row items-end justify-between">
            <View>
              <Text className="text-[38px] font-semibold tracking-[-1px] text-frost">
                7:42 <Text className="text-[15px] text-haze">PM</Text>
              </Text>
              <Text className="mt-[5px] text-[12px] text-haze">
                Tonight · Northwest → Southeast
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[25px] font-bold text-cyan">64°</Text>
              <Text className="mt-[3px] text-[8px] tracking-[1.3px] text-haze">
                MAX ELEV.
              </Text>
            </View>
          </View>

          <View className="mt-[20px] flex-row items-center justify-between">
            <View className="flex-row items-center rounded-[17px] border border-cyan/[0.42] bg-[rgba(20,75,83,0.45)] px-[11px] py-[8px]">
              <View className="mr-[7px] h-[6px] w-[6px] rounded-[3px] bg-mint" />
              <Text className="text-[11px] font-semibold text-cyan">
                Good conditions
              </Text>
            </View>
            <Text className="text-[11px] text-haze">12% cloud cover</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enable pass notifications for the ISS"
          className="mx-[20px] mt-[12px] flex-row items-center rounded-[21px] border border-edge bg-panel/[0.68] p-[17px] active:scale-[0.98] active:opacity-[0.65]"
        >
          <Text className="mr-[12px] text-[27px] text-violet">♢</Text>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-frost">
              Notify me when it passes
            </Text>
            <Text className="mt-[3px] text-[11px] text-haze">
              Current and saved locations
            </Text>
          </View>
          <View className="h-[28px] w-[48px] justify-center rounded-[14px] bg-[#264258] px-[3px]">
            <View className="ml-[20px] h-[22px] w-[22px] rounded-[11px] bg-cyan" />
          </View>
        </Pressable>

        <Text className="mx-[34px] mt-[17px] text-center text-[10px] leading-[15px] text-dusk">
          Position and pass information are illustrative until the tracking
          provider is connected.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
