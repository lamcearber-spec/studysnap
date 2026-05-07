import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";
import { useGetUsage } from "@workspace/api-client-react";

const isWeb = Platform.OS === "web";

export default function AccountSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tier, isSubscribed, appUserId, showManageSubscriptions } = useSubscription();
  const top = isWeb ? 67 : insets.top;
  const bottom = isWeb ? 24 : insets.bottom;

  const usageQuery = useGetUsage(
    { appUserId: appUserId ?? "" },
    {
      query: {
        queryKey: ["usage", appUserId ?? ""],
        enabled: Boolean(isSubscribed && appUserId),
        staleTime: 30 * 1000,
      },
    }
  );
  const usage = usageQuery.data;
  const usagePct = usage ? Math.min(1, usage.used / usage.limit) : 0;
  const resetLabel = usage
    ? new Date(usage.resetAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Account</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan status */}
        <View style={[styles.planBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.planIconWrap, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons name="ribbon-outline" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.planStatus, { color: colors.mutedForeground }]}>
              {isSubscribed ? "Active plan" : "Free plan"}
            </Text>
            <Text style={[styles.planName, { color: colors.foreground }]}>
              {isSubscribed ? (tier === "premium" ? "Premium" : "Starter") : "No subscription"}
            </Text>
          </View>
          {isSubscribed && (
            <Pressable
              style={[styles.switchBtn, { borderColor: colors.primary }]}
              onPress={() => router.push("/paywall")}
            >
              <Text style={[styles.switchText, { color: colors.primary }]}>Switch</Text>
            </Pressable>
          )}
        </View>

        {!isSubscribed && (
          <Pressable
            style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/paywall")}
          >
            <Ionicons name="sparkles-outline" size={18} color="#fff" />
            <Text style={styles.upgradeBtnText}>View plans</Text>
          </Pressable>
        )}

        {/* Usage meter */}
        {isSubscribed && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Image exercise quota</Text>
            {usage ? (
              <>
                <View style={[styles.usageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.usageHeader}>
                    <Text style={[styles.usageNumbers, { color: colors.foreground }]}>
                      {usage.used}
                      <Text style={[styles.usageLimit, { color: colors.mutedForeground }]}>
                        {" "}/ {usage.limit}
                      </Text>
                    </Text>
                    <Text style={[styles.usageReset, { color: colors.mutedForeground }]}>
                      Resets {resetLabel}
                    </Text>
                  </View>
                  <View style={[styles.track, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: `${usagePct * 100}%` as any,
                          backgroundColor: usagePct > 0.8 ? colors.destructive : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.usageCaption, { color: colors.mutedForeground }]}>
                    {usage.limit - usage.used} image exercises remaining this month
                  </Text>
                </View>
              </>
            ) : (
              <View style={[styles.usageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.usageCaption, { color: colors.mutedForeground }]}>
                  Loading usage…
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Manage */}
        {isSubscribed && (
          <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.65 : 1 }]}
              onPress={() => showManageSubscriptions()}
            >
              <Ionicons name="card-outline" size={20} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.primary }]}>Manage subscription</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Subscriptions renew automatically. Cancel anytime via your App Store account.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  navTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 20, gap: 20 },
  planBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  planIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  planStatus: { fontSize: 12, fontFamily: "Inter_500Medium" },
  planName: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  switchBtn: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  switchText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  upgradeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  usageCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  usageHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  usageNumbers: { fontSize: 28, fontFamily: "Inter_700Bold", fontVariant: ["tabular-nums"] },
  usageLimit: { fontSize: 18, fontFamily: "Inter_400Regular" },
  usageReset: { fontSize: 13, fontFamily: "Inter_400Regular" },
  track: { height: 8, borderRadius: 999, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999 },
  usageCaption: { fontSize: 13, fontFamily: "Inter_400Regular" },
  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    textAlign: "center",
  },
});
