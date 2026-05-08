import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import type { PurchasesPackage } from "react-native-purchases";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F } from "@/app/_components/tokens";
import { useProfile } from "@/context/ProfileContext";
import { useSession } from "@/context/SessionContext";
import { getFreeScansRemainingToday } from "@/lib/freeScans";
import { useSubscription } from "@/lib/revenuecat";

type BillingPeriod = "monthly" | "annual";
type PlanId = "starter" | "premium";

type Plan = {
  id: PlanId;
  name: string;
  monthly: string;
  annual: string;
  cap: number;
  packageIds: Record<BillingPeriod, string>;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: "$4.99",
    annual: "$49.90",
    cap: 40,
    packageIds: { monthly: "$rc_monthly", annual: "$rc_annual" },
  },
  {
    id: "premium",
    name: "Premium",
    monthly: "$9.99",
    annual: "$99.90",
    cap: 100,
    packageIds: { monthly: "premium_monthly", annual: "premium_annual" },
  },
];

function getCopy(language?: string) {
  if (language === "German") {
    return {
      title: "Wähle deinen BaraBara-Plan",
      subtitle: "Ein Scan pro Tag bleibt kostenlos. Bildreiche Übungen sind im Abo monatlich begrenzt.",
      ritual: "Seite fotografieren → wir machen passende Übungen → dein Kind löst sie → du markierst ✓ oder ✗.",
      monthly: "Monatlich",
      annual: "Jährlich",
      recommended: "Empfohlen",
      imageRich: "bildreiche Übungen",
      perMonth: "pro Monat",
      saveAnnual: "2 Monate kostenlos mit Jahresabo",
      subscribe: "Auswählen",
      restore: "Kauf wiederherstellen",
      freeScan: "Heutigen kostenlosen Scan nutzen",
      purchaseFailed: "Der Kauf ist fehlgeschlagen. Bitte versuche es erneut.",
      restoreFailed: "Käufe konnten nicht wiederhergestellt werden.",
    };
  }

  return {
    title: "Choose your BaraBara plan",
    subtitle: "One scan per day stays free. Image-rich practice is capped monthly by plan.",
    ritual: "Snap a page → we make matching practice → your child works it out → you mark ✓ or ✗.",
    monthly: "Monthly",
    annual: "Annual",
    recommended: "Recommended",
    imageRich: "image-rich practices",
    perMonth: "per month",
    saveAnnual: "2 months free with annual",
    subscribe: "Get",
    restore: "Restore purchase",
    freeScan: "Use today's free scan",
    purchaseFailed: "Purchase failed. Please try again.",
    restoreFailed: "Could not restore purchases.",
  };
}

function findPackage(
  packages: PurchasesPackage[],
  plan: Plan,
  billing: BillingPeriod,
) {
  return packages.find((pkg) => pkg.identifier === plan.packageIds[billing]);
}

function displayPrice(plan: Plan, billing: BillingPeriod, pkg?: PurchasesPackage) {
  return pkg?.product.priceString ?? (billing === "annual" ? plan.annual : plan.monthly);
}

function PlanCard({
  plan,
  billing,
  pkg,
  recommended,
  isPurchasing,
  onPurchase,
  copy,
}: {
  plan: Plan;
  billing: BillingPeriod;
  pkg?: PurchasesPackage;
  recommended: boolean;
  isPurchasing: boolean;
  onPurchase: (pkg: PurchasesPackage) => void;
  copy: ReturnType<typeof getCopy>;
}) {
  const pressable = Boolean(pkg) && !isPurchasing;
  const price = displayPrice(plan, billing, pkg);

  return (
    <View style={[styles.planCard, recommended && styles.planCardRecommended]}>
      <View style={styles.planTopRow}>
        <Text style={styles.planName}>{plan.name}</Text>
        {recommended && (
          <View style={styles.recommendedBadge}>
            <Ionicons name="star" size={12} color={C.yellowDeep} />
            <Text style={styles.recommendedText}>{copy.recommended}</Text>
          </View>
        )}
      </View>
      <Text style={styles.planPrice}>
        {price}
        <Text style={styles.planPriceUnit}>/{billing === "annual" ? "yr" : "mo"}</Text>
      </Text>
      <Text style={styles.planCap}>{plan.cap} {copy.imageRich}</Text>
      <Text style={styles.planMeta}>{copy.perMonth}</Text>
      {billing === "annual" && <Text style={styles.planSave}>{copy.saveAnnual}</Text>}

      <Pressable
        disabled={!pressable}
        onPress={() => {
          if (pkg) onPurchase(pkg);
        }}
        style={[styles.planButtonWrap, !pressable && { opacity: 0.55 }]}
      >
        <View style={styles.planButtonLedge} />
        <View style={[styles.planButtonFace, recommended && styles.planButtonFacePremium]}>
          {isPurchasing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.planButtonText}>{copy.subscribe} {plan.name}</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  const { sessions } = useSession();
  const { offerings, isSubscribed, purchase, restore, isPurchasing, isRestoring } = useSubscription();
  const [billing, setBilling] = useState<BillingPeriod>("annual");
  const [toast, setToast] = useState<string | null>(null);
  const copy = getCopy(profile?.language);
  const isWeb = Platform.OS === "web";
  const top = isWeb ? 56 : insets.top;
  const bottom = isWeb ? 28 : insets.bottom;
  const freeScansRemaining = getFreeScansRemainingToday(sessions);

  const packages = useMemo(
    () => offerings?.current?.availablePackages ?? [],
    [offerings?.current?.availablePackages],
  );

  if (isSubscribed) {
    router.replace("/");
    return null;
  }

  const doPurchase = async (pkg: PurchasesPackage) => {
    setToast(null);
    try {
      await purchase(pkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (error) {
      const maybeCancelled = error && typeof error === "object" && "userCancelled" in error;
      if (maybeCancelled) return;
      setToast(copy.purchaseFailed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const doRestore = async () => {
    setToast(null);
    try {
      await restore();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch {
      setToast(copy.restoreFailed);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: top + 16, paddingBottom: bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>BARABARA PREMIUM</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
          <Text style={styles.ritual}>{copy.ritual}</Text>
        </View>

        <View style={styles.toggle}>
          {(["monthly", "annual"] as BillingPeriod[]).map((period) => {
            const active = billing === period;
            return (
              <Pressable
                key={period}
                onPress={() => setBilling(period)}
                style={[styles.toggleItem, active && styles.toggleItemActive]}
              >
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                  {period === "monthly" ? copy.monthly : copy.annual}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.planGrid}>
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              pkg={findPackage(packages, plan, billing)}
              recommended={plan.id === "premium"}
              isPurchasing={isPurchasing}
              onPurchase={doPurchase}
              copy={copy}
            />
          ))}
        </View>

        {toast && (
          <View style={styles.toast}>
            <Ionicons name="alert-circle" size={18} color={C.error} />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        <Pressable onPress={doRestore} disabled={isRestoring} style={styles.restoreButton}>
          {isRestoring ? (
            <ActivityIndicator color={C.inkMuted} size="small" />
          ) : (
            <Text style={styles.restoreText}>{copy.restore}</Text>
          )}
        </Pressable>

        {freeScansRemaining > 0 && (
          <Pressable onPress={() => router.replace("/scan")} style={styles.freeScanButton}>
            <Text style={styles.freeScanText}>{copy.freeScan}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.surface,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  kicker: {
    fontFamily: F.bodyBold,
    fontSize: 11,
    color: C.inkMuted,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: F.display,
    fontSize: 30,
    lineHeight: 36,
    color: C.ink,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: F.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    color: C.inkBody,
  },
  ritual: {
    fontFamily: F.bodySemi,
    fontSize: 13,
    lineHeight: 19,
    color: C.primaryDark,
    backgroundColor: C.primaryTint,
    borderColor: C.primaryBorderTint,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: C.surfaceHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.hairline,
    padding: 4,
  },
  toggleItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleItemActive: {
    backgroundColor: C.card,
  },
  toggleText: {
    fontFamily: F.bodySemi,
    fontSize: 14,
    color: C.inkMuted,
  },
  toggleTextActive: {
    color: C.primary,
  },
  planGrid: {
    gap: 14,
  },
  planCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.hairline,
    padding: 16,
    gap: 10,
    boxShadow: "0 2px 0 rgba(27, 28, 28, 0.10)",
  },
  planCardRecommended: {
    borderColor: C.primary,
    backgroundColor: "#FBFFF8",
  },
  planTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  planName: {
    fontFamily: F.displaySemi,
    fontSize: 21,
    color: C.ink,
    letterSpacing: 0,
  },
  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.yellowSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendedText: {
    fontFamily: F.bodyBold,
    fontSize: 11,
    color: C.yellowDeep,
  },
  planPrice: {
    fontFamily: F.display,
    fontSize: 28,
    color: C.primary,
    letterSpacing: 0,
  },
  planPriceUnit: {
    fontFamily: F.bodySemi,
    fontSize: 14,
    color: C.inkMuted,
  },
  planCap: {
    fontFamily: F.bodyBold,
    fontSize: 15,
    color: C.ink,
  },
  planMeta: {
    fontFamily: F.body,
    fontSize: 13,
    color: C.inkMuted,
  },
  planSave: {
    fontFamily: F.bodySemi,
    fontSize: 13,
    color: C.yellowDeep,
  },
  planButtonWrap: {
    marginTop: 6,
  },
  planButtonLedge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    borderRadius: 10,
    backgroundColor: C.primaryShadow,
  },
  planButtonFace: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: C.primary,
  },
  planButtonFacePremium: {
    backgroundColor: C.primaryDark,
  },
  planButtonText: {
    fontFamily: F.bodyBold,
    fontSize: 15,
    color: "#fff",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF1F1",
    borderColor: "rgba(186, 26, 26, 0.22)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  toastText: {
    flex: 1,
    fontFamily: F.bodyMedium,
    color: C.error,
    fontSize: 13,
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  restoreText: {
    fontFamily: F.bodySemi,
    fontSize: 14,
    color: C.inkMuted,
  },
  freeScanButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  freeScanText: {
    fontFamily: F.bodySemi,
    color: C.primary,
    fontSize: 14,
  },
});
