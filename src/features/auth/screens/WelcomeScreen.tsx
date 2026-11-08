import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { OrbitalGateway } from "../components/OrbitalGateway";
import { useWelcomeViewModel } from "../viewmodels/useWelcomeViewModel";

export default function WelcomeScreen() {
  const vm = useWelcomeViewModel();

  return (
    <View className="flex-1 bg-space">
      <StatusBar style="light" />
      <OrbitalGateway still={vm.paused} style={StyleSheet.absoluteFill} />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(5,6,15,0.2)",
          "transparent",
          "rgba(5,6,15,0.65)",
          "#05060F",
        ]}
        locations={[0, 0.48, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View
          pointerEvents="box-none"
          className="flex-row items-center justify-between px-6 pt-2"
        >
          <View pointerEvents="none" className="min-w-0 flex-1 pr-2">
            <Text className="font-display text-[22px] tracking-[6px] text-ink">
              ORBIT
            </Text>
            <Text
              numberOfLines={1}
              className="mt-1 font-mono text-[9px] tracking-[1.5px] text-cyan"
            >
              A LITTLE CLOSER TO INFINITY
            </Text>
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
              loading={!vm.ready}
              onPress={() => vm.openAuth("login")}
            />
            <Button
              label="Create account"
              variant="outline"
              tone="cyan"
              disabled={!vm.ready}
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
