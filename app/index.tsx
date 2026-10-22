import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-[#060914] px-8">
      <Text className="text-xs font-bold tracking-[4px] text-[#78E6FF]">ORBIT</Text>
      <Text className="mt-4 text-center text-4xl font-bold text-[#F1F5FF]">
        Your universe.{"\n"}A little closer.
      </Text>
      <Text className="mt-4 text-center text-base leading-6 text-[#A8B6CE]">
        Follow the ISS and explore what is moving above you.
      </Text>
      <Link href="/satellite/25544" asChild>
        <Pressable className="mt-9 h-16 w-full items-center justify-center rounded-[22px] bg-[#78E6FF] active:opacity-70">
          <Text className="text-base font-extrabold text-[#061524]">Open satellite details  →</Text>
        </Pressable>
      </Link>
    </View>
  );
}
