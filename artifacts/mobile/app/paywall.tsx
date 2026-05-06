import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubscription } from "@/lib/revenuecat";
import { useColors } from "@/hooks/useColors";

const FEATURES = [
  { icon: "camera", text: "Unlimited classwork scans" },
  { icon: "sparkles", text: "AI-generated practice exercises" },
  { icon: "language", text: "5 languages: EN, DE, FR, ES, NL" },
  { icon: "trending-up", text: "3 difficulty levels" },
  { icon: "book", text: "All subjects — Math, Science & more" },
  { icon: "checkmark-circle", text: "Instant feedback on answers" },
];

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { offerings, isSubscribed, purchase, restore, isPurchasing, isRestoring, isLoading } =
    useSubscription();

  const isWeb = Platform.OS === "web";
  const top = isWeb ? 60 : insets.top;
  const bottom = isWeb ? 24 : insets.bottom;

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pkg = offerings?.current?.availablePackages?.[0];
  const priceString = pkg?.product?.priceString ?? "$4.99";
  const productTitle = pkg?.product?.title ?? "StudySnap Premium";

  if (isSubscribed) {
    router.replace("/");
    return null;
  }

  const handlePurchase = async () => {
    if (!pkg) return;
    if (__DEV__) {
      setConfirmVisible(true);
      return;
    }
    await doPurchase();
  };

  const doPurchase = async () => {
    setConfirmVisible(false);
    setError(null);
    try {
      await purchase(pkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (e: any) {
      if (e?.userCancelled) return;
      setError("Purchase failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRestore = async () => {
    setError(null);
    try {
      await restore();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isSubscribed) router.replace("/");
    } catch {
      setError("Could not restore purchases. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Dev-mode purchase confirmation modal */}
      <Modal transparent visible={confirmVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Test Purchase</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              This is a test environment purchase. No real payment will be charged.{"\n\n"}
              Simulate purchasing <Text style={{ fontFamily: "Inter_700Bold" }}>{productTitle}</Text> for{" "}
              <Text style={{ fontFamily: "Inter_700Bold" }}>{priceString}/month</Text>?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={doPurchase}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.primary, "#6366F1", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: top + 20 }]}
        >
          <Text style={styles.heroEmoji}>🎓</Text>
          <Text style={styles.heroTitle}>StudySnap Premium</Text>
          <Text style={styles.heroSub}>
            Help your child ace their exams with unlimited AI-powered practice exercises
          </Text>

          <View style={styles.priceBubble}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Text style={[styles.priceAmount, { color: colors.primary }]}>{priceString}</Text>
                <Text style={[styles.pricePer, { color: colors.mutedForeground }]}>/month</Text>
              </>
            )}
          </View>
        </LinearGradient>

        {/* Feature list */}
        <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.featuresTitle, { color: colors.foreground }]}>Everything included</Text>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name={f.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Cancel note */}
        <View style={[styles.noteCard, { backgroundColor: colors.muted }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            Cancel anytime. Billed monthly. No long-term commitment.
          </Text>
        </View>

        {error && (
          <View style={[styles.errorCard, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* CTA buttons */}
        <View style={styles.ctaStack}>
          <Pressable
            onPress={handlePurchase}
            disabled={isPurchasing || isLoading || !pkg}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={isPurchasing || !pkg ? ["#9CA3AF", "#6B7280"] : [colors.primary, "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.subscribeBtn}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="star" size={18} color="#fff" />
                  <Text style={styles.subscribeBtnText}>
                    Subscribe for {priceString}/month
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleRestore}
            disabled={isRestoring}
            style={styles.restoreBtn}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.mutedForeground} />
            ) : (
              <Text style={[styles.restoreBtnText, { color: colors.mutedForeground }]}>
                Restore previous purchase
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { gap: 0 },
  hero: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 48,
    gap: 10,
  },
  heroEmoji: { fontSize: 52, marginBottom: 4 },
  heroTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
  },
  heroSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 22,
  },
  priceBubble: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 8,
    gap: 4,
    minWidth: 120,
    justifyContent: "center",
    minHeight: 52,
  },
  priceAmount: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  pricePer: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  featuresCard: {
    margin: 20,
    marginTop: -24,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#EF4444",
    flex: 1,
  },
  ctaStack: {
    paddingHorizontal: 20,
    gap: 12,
  },
  subscribeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 18,
  },
  subscribeBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  restoreBtn: {
    alignItems: "center",
    padding: 12,
  },
  restoreBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  modalBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
