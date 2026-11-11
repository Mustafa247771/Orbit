import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { Launch } from "../model/Launch";

type Props = { launch: Launch | null; onClose: () => void; onCalendar?: () => void; adding?: boolean };
export function LaunchDetailsModal({ launch, onClose, onCalendar, adding }: Props) {
  return (
    <Modal visible={launch !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/[0.78]">
        <Pressable accessibilityRole="button" accessibilityLabel="Close launch details" onPress={onClose} className="flex-1" />
        {launch && (
          <View className="max-h-[85%] overflow-hidden rounded-t-[28px] border border-edge bg-night">
            <ScrollView contentContainerClassName="pb-[50px]">
              {launch.imageUrl ? <Image source={{ uri: launch.imageUrl }} resizeMode="cover" className="h-[190px] w-full" /> : null}
              <View className="px-[23px] pt-[20px]">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-semibold tracking-[1px] text-cyan">{launch.status.toUpperCase()}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Close details" onPress={onClose}>
                    <Text className="text-[15px] font-bold text-cyan">Close ✕</Text>
                  </Pressable>
                </View>
                <Text className="mt-[15px] text-[26px] font-bold leading-[32px] text-frost">{launch.name}</Text>
                <Text className="mt-[13px] text-[13px] text-haze">{launch.provider} · {launch.rocket}</Text>
                <Text className="mt-[18px] text-[10px] font-extrabold tracking-[1px] text-cyan">TARGET TIME</Text>
                <Text className="mt-[5px] text-[14px] text-frost">{new Date(launch.net).toLocaleString()}</Text>
                <Text className="mt-[17px] text-[10px] font-extrabold tracking-[1px] text-cyan">LAUNCH SITE</Text>
                <Text className="mt-[5px] text-[14px] text-frost">{launch.pad} · {launch.location}</Text>
                <Text className="mt-[17px] text-[10px] font-extrabold tracking-[1px] text-cyan">MISSION DETAILS</Text>
                <Text className="mt-[5px] text-[13px] leading-[21px] text-haze">{launch.description}</Text>
                {onCalendar && <Pressable accessibilityRole="button" disabled={adding} onPress={onCalendar}
                  className="mt-[23px] items-center rounded-[18px] bg-cyan px-[16px] py-[15px]">
                  <Text className="text-[13px] font-extrabold text-deep">{adding ? "Opening Calendar…" : "Add to phone calendar"}</Text>
                </Pressable>}
                <Text className="mt-[17px] text-center text-[10px] text-mist">Launch schedules may change. Confirm the date before traveling.</Text>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}
