import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppearance } from "@/context/AppearanceContext";
import { useProfile } from "@/context/ProfileContext";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";

const isWeb = Platform.OS === "web";

const APPEARANCE_LABELS: Record<string, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export default function SettingsHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  const { tier, isSubscribed } = useSubscription();
  const { appearance } = useAppearance();
  const top = isWeb ? 67 : insets.top;
  const bottom = isWeb ? 24 : insets.bottom;

  const goTo = (path: string) => {
    if (!isWeb) Haptics.selectionAsync();
    router.push(path as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Student section */}
        <View style={styles.groupLabel}>
          <Text style={[styles.groupLabelText, { color: colors.mutedForeground }]}>PROFILE</Text>
        </View>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="person-outline"
            iconBg="#4F46E5"
            label="User"
            value={profile?.name ?? "Not set"}
            onPress={() => goTo("/settings/user")}
            colors={colors}
          />
        </View>

        {/* Account section */}
        <View style={styles.groupLabel}>
          <Text style={[styles.groupLabelText, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        </View>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="card-outline"
            iconBg="#8B5CF6"
            label="Subscription"
            value={isSubscribed ? (tier === "premium" ? "Premium" : "Starter") : "Free"}
            onPress={() => goTo("/settings/account")}
            colors={colors}
          />
        </View>

        {/* Appearance section */}
        <View style={styles.groupLabel}>
          <Text style={[styles.groupLabelText, { color: colors.mutedForeground }]}>PREFERENCES</Text>
        </View>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="contrast-outline"
            iconBg="#64748B"
            label="Display"
            value={APPEARANCE_LABELS[appearance] ?? "System"}
            onPress={() => goTo("/settings/display")}
            colors={colors}
          />
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          StudySnap · Version 1.0
        </Text>
      </ScrollView>
    </View>
  );
}

function SettingsRow({
  icon,
  iconBg,
  label,
  value,
  onPress,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconBg: string;
  label: string;
  value: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.65 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color="#fff" />
      </View>
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.mutedForeground }]} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

function Separator({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.sep, { backgroundColor: colors.border }]} />
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
  scroll: { paddingTop: 24, paddingHorizontal: 16, gap: 0 },
  groupLabel: { paddingHorizontal: 4, paddingBottom: 6, marginTop: 20 },
  groupLabelText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  rowValue: { fontSize: 14, fontFamily: "Inter_400Regular", maxWidth: 140 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
  version: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 36,
  },
});
