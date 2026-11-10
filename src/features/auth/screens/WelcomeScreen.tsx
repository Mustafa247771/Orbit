import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { OrbitalGateway } from "../components/OrbitalGateway";
import { useWelcomeViewModel } from "../viewmodels/useWelcomeViewModel";

export default function WelcomeScreen() {
  const vm = useWelcomeViewModel();

  return (
    <View className="flex-1 bg-space">
      <StatusBar style="light" />
      <OrbitalGateway still={vm.paused} className="absolute inset-0" />
      <View
        pointerEvents="none"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-space/70"
      />

      <SafeAreaView pointerEvents="box-none" className="absolute inset-0">
        <View
          pointerEvents="box-none"
          className="flex-row items-center justify-between px-6 pt-2"
        >
          <View pointerEvents="none" className="min-w-0 flex-1 pr-2">
            <Text className="font-display text-[22px] tracking-[6px] text-ink">
              ORBIT
            </Text>
            <Label tone="cyan" numberOfLines={1} className="mt-1">
              A little closer to infinity
            </Label>
          </View>
          <Button
            label={vm.still ? "Resume motion" : "Pause motion"}
            onPress={vm.toggleMotion}
            variant="ghost"
            tone="cyan"
          />
        </View>

        <View pointerEvents="none" className="flex-1" />

        <View pointerEvents="box-none" className="px-7 pb-6">
          <View pointerEvents="none">
            <Text className="mb-5 font-mono text-[10px] tracking-[2px] text-cyan">
              DRAG TO EXPLORE · TAP TO IGNITE
            </Text>
            <Text className="font-display text-[40px] leading-[44px] text-ink">
              A universe{"\n"}within reach.
            </Text>
            <Text className="mb-7 mt-3 text-[15px] leading-6 text-pale">
              Follow satellites. Find your place in the sky.
            </Text>
          </View>
          <View className="gap-3">
            <Button
              label="Log in"
              size="lg"
              onPress={() => vm.openAuth("login")}
            />
            <Button
              label="Create account"
              variant="outline"
              tone="cyan"
              onPress={() => vm.openAuth("signup")}
            />
            <Button
              label="Explore as guest"
              variant="ghost"
              onPress={vm.exploreGuest}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
