import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";
import { SessionProvider } from "@/context/SessionContext";
import { initializeRevenueCat, SubscriptionProvider, useSubscription } from "@/lib/revenuecat";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

try {
  initializeRevenueCat();
} catch (err: any) {
  Alert.alert("RevenueCat Unavailable", err?.message ?? "Unknown error");
}

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { profile, isLoading: profileLoading } = useProfile();
  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  // Give subscription a max 3s to resolve, then treat as not subscribed
  const [subReady, setSubReady] = React.useState(false);
  useEffect(() => {
    if (!subLoading) { setSubReady(true); return; }
    const timer = setTimeout(() => setSubReady(true), 3000);
    return () => clearTimeout(timer);
  }, [subLoading]);

  useEffect(() => {
    if (profileLoading || !subReady) return;

    const inOnboarding = segments[0] === "onboarding";
    const inPaywall = segments[0] === "paywall";

    if (!profile && !inOnboarding) {
      router.replace("/onboarding");
    } else if (profile && inOnboarding) {
      router.replace(isSubscribed ? "/" : "/paywall");
    } else if (profile && !isSubscribed && !inPaywall) {
      router.replace("/paywall");
    }
  }, [profile, profileLoading, isSubscribed, subReady, segments]);

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
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
