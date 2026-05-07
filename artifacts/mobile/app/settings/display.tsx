import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type AppearancePref, useAppearance } from "@/context/AppearanceContext";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

const MODES: { id: AppearancePref; label: string; desc: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  {
    id: "system",
    label: "System default",
    desc: "Follows your device's appearance setting",
    icon: "phone-portrait-outline",
  },
  {
    id: "light",
    label: "Light",
    desc: "Always use the light theme",
    icon: "sunny-outline",
  },
  {
    id: "dark",
    label: "Dark",
    desc: "Always use the dark theme",
    icon: "moon-outline",
  },
];

export default function DisplaySettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appearance, setAppearance } = useAppearance();
  const top = isWeb ? 67 : insets.top;
  const bottom = isWeb ? 24 : insets.bottom;

  const select = async (id: AppearancePref) => {
    if (!isWeb) Haptics.selectionAsync();
    await setAppearance(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Display</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: colors.foreground }]}>Appearance</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
          Choose how StudySnap looks on your device
        </Text>

        <View style={styles.options}>
          {MODES.map((mode, idx) => {
            const isSelected = appearance === mode.id;
            return (
              <Pressable
                key={mode.id}
                style={[
                  styles.option,
                  {
                    backgroundColor: isSelected ? colors.primary + "10" : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderTopLeftRadius: idx === 0 ? 16 : 0,
                    borderTopRightRadius: idx === 0 ? 16 : 0,
                    borderBottomLeftRadius: idx === MODES.length - 1 ? 16 : 0,
                    borderBottomRightRadius: idx === MODES.length - 1 ? 16 : 0,
                    borderTopWidth: idx === 0 ? 1.5 : 0,
                    borderLeftWidth: 1.5,
                    borderRightWidth: 1.5,
                    borderBottomWidth: 1.5,
                    marginTop: idx === 0 ? 0 : -1,
                  },
                ]}
                onPress={() => select(mode.id)}
              >
                <View style={[styles.iconWrap, { backgroundColor: isSelected ? colors.primary : colors.muted }]}>
                  <Ionicons name={mode.icon} size={20} color={isSelected ? "#fff" : colors.mutedForeground} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: isSelected ? colors.primary : colors.foreground }]}>
                    {mode.label}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {mode.desc}
                  </Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : (
                  <View style={[styles.radio, { borderColor: colors.border }]} />
                )}
              </Pressable>
            );
          })}
        </View>
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
  scroll: { padding: 20, gap: 16 },
  heading: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subheading: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: -8 },
  options: { marginTop: 4 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  optionDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
});
