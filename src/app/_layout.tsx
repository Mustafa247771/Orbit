import "@/components/three/expoGl";
import "fast-text-encoding";

import "@/theme/interop";
import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import "../../global.css";

import { NotificationSync } from "@/core/notifications/NotificationSync";
import {
  AuthProvider,
  useAuthSession,
} from "@/features/auth/viewmodels/AuthProvider";
import { ProfileProvider } from "@/features/profile/viewmodels/ProfileProvider";
import colors from "@/theme/colors";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { SpaceGrotesk_600SemiBold } from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

export const unstable_settings = {
  anchor: "(tabs)/index",
};

function AppNavigator() {
  const { ready, canAccessAccount } = useAuthSession();
  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-space">
        <ActivityIndicator color={colors.accent} />
        <Text className="text-sm text-muted">Restoring your session…</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.space },
      }}
    >
      <Stack.Protected guard={canAccessAccount}>
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="passes/[id]" />
        <Stack.Screen name="sky-finder/[id]" />
        <Stack.Screen name="sightings/new" />
        <Stack.Screen name="launches/index" />
        <Stack.Screen name="spaceflight/index" />
        <Stack.Screen name="apod/index" />
        <Stack.Screen name="community/index" />
        <Stack.Screen name="achievements/index" />
      </Stack.Protected>
    </Stack>
  );
}

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
    <AuthProvider>
      <ProfileProvider>
        <NotificationSync />
        <View className="flex-1 bg-space">
          <AppNavigator />
        </View>
      </ProfileProvider>
    </AuthProvider>
  );
}
