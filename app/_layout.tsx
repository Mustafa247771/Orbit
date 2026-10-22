import { Stack } from "expo-router";
import { View } from "react-native";
import "../global.css";

import { PlanetMenu } from "@/components/navigation/PlanetMenu";

export default function RootLayout() {
  return (
    <View style={{ backgroundColor: "#060914", flex: 1 }}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "#060914" },
          headerShown: false,
        }}
      />
      <PlanetMenu />
    </View>
  );
}
