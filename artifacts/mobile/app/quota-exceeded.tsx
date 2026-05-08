import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F } from "@/app/_components/tokens";

function tactileButton(primary: boolean) {
  return (
    <View style={styles.buttonWrap}>
      <View style={[styles.buttonLedge, primary ? styles.primaryLedge : styles.secondaryLedge]} />
      <View style={[styles.buttonFace, primary ? styles.primaryFace : styles.secondaryFace]}>
        <Text style={[styles.buttonText, primary ? styles.primaryText : styles.secondaryText]}>
          {primary ? "Upgrade to Premium" : "Continue with text only"}
        </Text>
      </View>
    </View>
  );
}

export default function QuotaExceededScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sessionId, resetAt, used } = useLocalSearchParams<{
    sessionId?: string;
    resetAt?: string;
    used?: string;
    limit?: string;
  }>();
  const isWeb = Platform.OS === "web";
  const top = isWeb ? 56 : insets.top;
  const premiumRemaining = Math.max(0, 100 - Number(used ?? 0));
  const resetLabel = resetAt
    ? new Date(resetAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })
    : "your next billing month";

  return (
    <View style={[styles.screen, { paddingTop: top + 18, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.handle} />
      <View style={styles.iconWrap}>
        <Ionicons name="images" size={28} color={C.primary} />
      </View>
      <Text style={styles.title}>You've used all your images this month.</Text>
      <Text style={styles.body}>
        Your quota resets on {resetLabel}. Until then, you can keep using BaraBara with text-only exercises,
        or upgrade to Premium for {premiumRemaining} more images right now.
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.replace(sessionId ? `/exercises/${sessionId}` : "/");
          }}
        >
          {tactileButton(false)}
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace("/paywall");
          }}
        >
          {tactileButton(true)}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.surface,
    paddingHorizontal: 22,
    gap: 18,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: C.surfaceHigh,
    marginBottom: 8,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: C.primaryTint,
    borderWidth: 1,
    borderColor: C.primaryBorderTint,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: F.display,
    fontSize: 30,
    lineHeight: 36,
    color: C.ink,
    letterSpacing: 0,
  },
  body: {
    fontFamily: F.bodyMedium,
    fontSize: 15,
    lineHeight: 23,
    color: C.inkBody,
  },
  actions: {
    marginTop: "auto",
    gap: 14,
  },
  buttonWrap: {
    minHeight: 54,
  },
  buttonLedge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    borderRadius: 10,
  },
  primaryLedge: {
    backgroundColor: C.primaryShadow,
  },
  secondaryLedge: {
    backgroundColor: C.hairline,
  },
  buttonFace: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
  },
  primaryFace: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  secondaryFace: {
    backgroundColor: C.card,
    borderColor: C.hairline,
  },
  buttonText: {
    fontFamily: F.bodyBold,
    fontSize: 15,
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: C.primary,
  },
});

