import {
  InteractiveStarField,
  StarPointer,
} from "@/components/ui/InteractiveStarField";
import { useNewSightingViewModel } from "@/features/sightings/viewmodels/useNewSightingViewModel";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  PointerEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import colors from "@/theme/colors";
export default function NewSightingScreen() {
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
  const viewModel = useNewSightingViewModel();

  async function saveSighting() {
    const saved = await viewModel.save();
    if (!saved) return;
    Alert.alert(
      "Sighting saved",
      saved.syncStatus === "pending-upload"
        ? "Saved safely on this device and queued for community upload."
        : "Saved safely in your private observation journal.",
    );
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
        className="flex-1"
        contentContainerClassName="pb-[126px]"
        keyboardShouldPersistTaps="handled"
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
            <Text className="text-[8px] font-extrabold tracking-[1.8px] text-haze">
              OBSERVATION JOURNAL
            </Text>
            <Text className="mt-[4px] text-[16px] font-semibold text-frost">
              New sighting
            </Text>
          </View>
          <View className="flex-row items-center rounded-[16px] border border-edge-strong bg-panel/[0.9] px-[10px] py-[8px]">
            <View className="mr-[6px] h-[6px] w-[6px] rounded-[3px] bg-gold" />
            <Text className="text-[8px] font-extrabold tracking-[1px] text-gold">
              {viewModel.busyAction === "save" ? "SAVING" : "DRAFT"}
            </Text>
          </View>
        </View>

        <View className="px-[24px] pt-[28px]">
          <Text className="text-[40px] font-bold leading-[43px] tracking-[-1.3px] text-frost">
            Keep the{`\n`}moment.
          </Text>
          <Text className="mt-[12px] max-w-[340px] text-[14px] leading-[21px] text-haze">
            A streak of light, a precise time and your own view of the sky.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            viewModel.photoUri
              ? "Change sighting photo"
              : "Choose a sighting photo"
          }
          onPress={viewModel.choosePhoto}
          className="mx-[20px] mt-[24px] h-[246px] overflow-hidden rounded-[26px] border border-edge-soft active:scale-[0.985] active:opacity-[0.68]"
        >
          <LinearGradient
            colors={
              viewModel.photoUri
                ? ["#1D3155", "#0B1426"]
                : [colors.panel, "#0A101D"]
            }
            className="absolute inset-0"
          />
          <View className="absolute left-[16%] top-[22%] h-[3px] w-[3px] rounded-[2px] bg-ice opacity-[0.62]" />
          <View className="absolute left-[76%] top-[31%] h-[2px] w-[2px] rounded-[2px] bg-ice opacity-[0.52]" />
          <View className="absolute left-[61%] top-[14%] h-[3px] w-[3px] rounded-[2px] bg-ice opacity-[0.58]" />
          {viewModel.photoUri ? (
            <>
              <Image
                resizeMode="cover"
                source={{ uri: viewModel.photoUri }}
                className="absolute inset-0"
              />
              <LinearGradient
                colors={["transparent", "rgba(2,8,18,0.7)"]}
                className="absolute inset-0"
              />
              <View className="absolute bottom-[14px] left-[14px] flex-row items-center rounded-[16px] border border-cyan/[0.44] bg-deep/[0.86] px-[11px] py-[7px]">
                <Text className="mr-[7px] text-[11px] text-mint">✓</Text>
                <Text className="text-[10px] font-semibold text-[#CDEBF4]">
                  Sighting photo selected
                </Text>
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center px-[26px]">
              <View className="h-[56px] w-[56px] items-center justify-center rounded-[28px] border border-cyan/[0.4] bg-cyan/[0.1]">
                <Text className="text-[25px] text-cyan">▣</Text>
              </View>
              <Text className="mt-[14px] text-[16px] font-bold text-frost">
                Add a view of the sky
              </Text>
              <Text className="mt-[6px] text-center text-[11px] text-mist">
                Take a photo or choose one from your library
              </Text>
            </View>
          )}
        </Pressable>

        <View className="mx-[20px] mt-[10px] flex-row gap-[10px]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture photo"
            disabled={viewModel.busyAction !== null}
            onPress={viewModel.takePhoto}
            className="h-[50px] flex-1 flex-row items-center justify-center rounded-[18px] border border-edge-soft bg-panel/[0.72] active:scale-[0.985] active:opacity-[0.68]"
          >
            {viewModel.busyAction === "camera" ? (
              <ActivityIndicator color={colors.cyan} />
            ) : (
              <Text className="mr-[8px] text-[18px] text-cyan">◉</Text>
            )}
            <Text className="text-[12px] font-semibold text-frost">
              {viewModel.busyAction === "camera" ? "Opening…" : "Take photo"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose photo from library"
            disabled={viewModel.busyAction !== null}
            onPress={viewModel.choosePhoto}
            className="h-[50px] flex-1 flex-row items-center justify-center rounded-[18px] border border-edge-soft bg-panel/[0.72] active:scale-[0.985] active:opacity-[0.68]"
          >
            {viewModel.busyAction === "library" ? (
              <ActivityIndicator color={colors.cyan} />
            ) : (
              <Text className="mr-[8px] text-[18px] text-cyan">▧</Text>
            )}
            <Text className="text-[12px] font-semibold text-frost">
              {viewModel.busyAction === "library" ? "Opening…" : "Choose photo"}
            </Text>
          </Pressable>
        </View>

        <View className="mx-[20px] mt-[25px]">
          <Text className="mb-[10px] text-[9px] font-extrabold tracking-[1.7px] text-haze">
            YOUR OBSERVATION
          </Text>
          <View className="min-h-[126px] overflow-hidden rounded-[20px] border border-edge-strong bg-panel/[0.7]">
            <TextInput
              accessibilityLabel="Observation caption"
              multiline
              maxLength={240}
              onChangeText={viewModel.setCaption}
              placeholder="What did you notice?"
              placeholderTextColor="#65748D"
              className="min-h-[100px] p-[16px] pb-[30px] text-[14px] leading-[21px] text-frost"
              textAlignVertical="top"
              value={viewModel.caption}
            />
            <Text className="absolute bottom-[11px] right-[14px] text-[9px] text-dusk">
              {viewModel.caption.length}/240
            </Text>
          </View>
        </View>

        <View className="mx-[20px] mt-[20px] overflow-hidden rounded-[22px] border border-edge bg-panel/[0.58] px-[16px]">
          <View className="min-h-[76px] flex-row items-center">
            <View className="mr-[12px] h-[34px] w-[34px] items-center justify-center rounded-[16px] bg-cyan/[0.08]">
              <Text className="text-[20px] text-cyan">⌁</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[7px] font-extrabold tracking-[1.2px] text-dusk">
                OBJECT
              </Text>
              <Text className="mt-[4px] text-[13px] font-semibold text-frost">
                {viewModel.object.name}
              </Text>
            </View>
            <Text className="text-[25px] text-cyan">›</Text>
          </View>
          <View className="ml-[46px] h-[1px] bg-edge" />
          <View className="min-h-[76px] flex-row items-center">
            <View className="mr-[12px] h-[34px] w-[34px] items-center justify-center rounded-[16px] bg-cyan/[0.08]">
              <Text className="text-[20px] text-cyan">◷</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[7px] font-extrabold tracking-[1.2px] text-dusk">
                OBSERVED
              </Text>
              <Text className="mt-[4px] text-[13px] font-semibold text-frost">
                {viewModel.observedLabel}
              </Text>
            </View>
            <Text className="text-[25px] text-cyan">›</Text>
          </View>
          <View className="ml-[46px] h-[1px] bg-edge" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach current location"
            disabled={viewModel.busyAction !== null}
            onPress={viewModel.useCurrentLocation}
            className="min-h-[76px] flex-row items-center active:scale-[0.985] active:opacity-[0.68]"
          >
            <View className="mr-[12px] h-[34px] w-[34px] items-center justify-center rounded-[16px] bg-cyan/[0.08]">
              <Text className="text-[20px] text-cyan">⌾</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[7px] font-extrabold tracking-[1.2px] text-dusk">
                LOCATION
              </Text>
              <Text className="mt-[4px] text-[13px] font-semibold text-frost">
                {viewModel.location?.cityLabel ?? "Use current location"}
              </Text>
              <Text className="mt-[3px] text-[9px] text-mist">
                {viewModel.location
                  ? "Precise coordinates stay private"
                  : "Tap to attach GPS coordinates"}
              </Text>
            </View>
            {viewModel.busyAction === "location" ? (
              <ActivityIndicator color={colors.cyan} />
            ) : (
              <Text className="text-[25px] text-cyan">›</Text>
            )}
          </Pressable>
        </View>

        <View className="mx-[20px] mt-[25px]">
          <Text className="mb-[10px] text-[9px] font-extrabold tracking-[1.7px] text-haze">
            VISIBILITY
          </Text>
          <View className="flex-row gap-[10px]">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: viewModel.visibility === "private",
              }}
              onPress={() => viewModel.setVisibility("private")}
              className={`min-h-[72px] flex-1 flex-row items-center rounded-[20px] border p-[13px] ${viewModel.visibility === "private" ? "border-cyan bg-[rgba(24,70,86,0.62)]" : "border-edge bg-panel/[0.55]"}`}
            >
              <Text
                className={`mr-[9px] text-[19px] ${viewModel.visibility === "private" ? "text-cyan" : "text-mist"}`}
              >
                ◉
              </Text>
              <View>
                <Text
                  className={`text-[12px] font-bold ${viewModel.visibility === "private" ? "text-cyan" : "text-haze"}`}
                >
                  Private
                </Text>
                <Text className="mt-[3px] text-[8px] text-dusk">
                  Only in my journal
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: viewModel.visibility === "community",
              }}
              onPress={() => viewModel.setVisibility("community")}
              className={`min-h-[72px] flex-1 flex-row items-center rounded-[20px] border p-[13px] ${viewModel.visibility === "community" ? "border-cyan bg-[rgba(24,70,86,0.62)]" : "border-edge bg-panel/[0.55]"}`}
            >
              <Text
                className={`mr-[9px] text-[19px] ${viewModel.visibility === "community" ? "text-cyan" : "text-mist"}`}
              >
                ✦
              </Text>
              <View>
                <Text
                  className={`text-[12px] font-bold ${viewModel.visibility === "community" ? "text-cyan" : "text-haze"}`}
                >
                  Community
                </Text>
                <Text className="mt-[3px] text-[8px] text-dusk">
                  Share city-level location
                </Text>
              </View>
            </Pressable>
          </View>
          {viewModel.visibility === "community" && (
            <View className="mt-[10px] flex-row items-start rounded-[15px] border border-mint/[0.2] bg-mint/[0.07] p-[11px]">
              <Text className="mr-[8px] text-[11px] text-mint">✓</Text>
              <Text className="flex-1 text-[9px] leading-[13px] text-[#8FB7AC]">
                Exact GPS and photo metadata will be removed before publishing.
              </Text>
            </View>
          )}
        </View>

        {viewModel.error && (
          <View
            accessibilityRole="alert"
            className="mx-[20px] mt-[16px] rounded-[15px] border border-rose/[0.42] bg-rose/[0.1] p-[12px]"
          >
            <Text className="text-center text-[11px] leading-[16px] text-rose-light">
              {viewModel.error}
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save sighting"
          disabled={viewModel.busyAction !== null}
          onPress={saveSighting}
          className="mx-[20px] mt-[24px] h-[64px] flex-row items-center justify-center rounded-[21px] bg-cyan active:scale-[0.985] active:opacity-[0.68]"
        >
          {viewModel.busyAction === "save" ? (
            <ActivityIndicator color={colors.deep} />
          ) : (
            <Text className="mr-[10px] text-[17px] text-deep">✓</Text>
          )}
          <Text className="text-[16px] font-extrabold text-deep">
            {viewModel.busyAction === "save" ? "Saving…" : "Save sighting"}
          </Text>
        </Pressable>

        <Text className="mx-[30px] mt-[14px] text-center text-[9px] text-dusk">
          Photos and sightings are saved offline on this device. Community posts
          are queued until a backend is connected.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
