import {
  Epilogue_600SemiBold,
  Epilogue_700Bold,
} from "@expo-google-fonts/epilogue";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { LibreCaslonText_400Regular_Italic, LibreCaslonText_700Bold } from "@expo-google-fonts/libre-caslon-text";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppearanceProvider } from "@/context/AppearanceContext";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";
import { SessionProvider } from "@/context/SessionContext";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

try {
  initializeRevenueCat();
} catch (err: any) {
  Alert.alert("RevenueCat Unavailable", err?.message ?? "Unknown error");
}

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { profile, isLoading: profileLoading } = useProfile();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (profileLoading) return;

    const inOnboarding = segments[0] === "onboarding";

    if (!profile && !inOnboarding) {
      router.replace("/onboarding");
    } else if (profile && inOnboarding) {
      router.replace("/");
    }
  }, [profile, profileLoading, segments]);

  // Show children immediately — navigation redirects handle the rest
  if (profileLoading) return null;

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <NavigationGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="exercises/[id]" />
        <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="paywall" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="quota-exceeded" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      </Stack>
    </NavigationGuard>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    LibreCaslonText_400Regular_Italic,
    LibreCaslonText_700Bold,
    Epilogue_600SemiBold,
    Epilogue_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppearanceProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <ProfileProvider>
                  <SessionProvider>
                    <SubscriptionProvider>
                      <RootLayoutNav />
                    </SubscriptionProvider>
                  </SessionProvider>
                </ProfileProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </AppearanceProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
