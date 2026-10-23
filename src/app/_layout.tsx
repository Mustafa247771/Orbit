import "@/components/three/expoGl";
import "fast-text-encoding";

import { Stack } from "expo-router";
import { View } from "react-native";
import "../../global.css";

import { PlanetMenu } from "@/components/navigation/PlanetMenu";
import colors from "@/theme/colors";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { SpaceGrotesk_600SemiBold } from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_600SemiBold,
    JetBrainsMono_500Medium,
  });
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <View style={{ flex: 1, backgroundColor: colors.space }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.space },
        }}
      />
      <PlanetMenu />
    </View>
  );
}
