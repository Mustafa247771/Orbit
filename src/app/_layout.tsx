import "@/components/three/expoGl";
import "fast-text-encoding";

import { Stack } from "expo-router";
import { View } from "react-native";
import "../../global.css";

import { PlanetMenu } from "@/components/navigation/PlanetMenu";
import colors from "@/theme/colors";

export default function RootLayout() {
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
