import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { AuthForm } from "../components/AuthForm";
import { OrbitalGateway } from "../components/OrbitalGateway";
import { useAuthViewModel } from "../viewmodels/useAuthViewModel";

export default function LoginScreen() {
  const vm = useAuthViewModel();

  return (
    <View className="flex-1 bg-space">
      <StatusBar style="light" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <OrbitalGateway
          still
          height={500}
          style={{
            position: "absolute",
            top: -100,
            left: 0,
            right: 0,
            opacity: 0.35,
          }}
        />
        <LinearGradient
          colors={["rgba(5,6,15,0.25)", "#05060F"]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 24,
            }}
          >
            <View className="flex-row items-center justify-between py-2">
              <Button
                label="Back"
                icon="back"
                variant="ghost"
                tone="cyan"
                onPress={vm.back}
                disabled={vm.busy}
              />
              <Text className="font-display text-lg tracking-[5px] text-ink">
                ORBIT
              </Text>
            </View>
            <View className="pb-7 pt-9">
              <Text className="mb-3 font-mono text-[10px] tracking-[3px] text-cyan">
                ACCOUNT ACCESS
              </Text>
              <Text className="font-display text-[34px] leading-[40px] text-ink">
                {vm.title}
              </Text>
              <Text className="mt-3 text-[15px] leading-6 text-pale">
                {vm.subtitle}
              </Text>
            </View>
            <AuthForm vm={vm} />
            <Button
              label="Explore as guest"
              variant="ghost"
              onPress={vm.exploreGuest}
              disabled={vm.busy}
              className="mt-5"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
