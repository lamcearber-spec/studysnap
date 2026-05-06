import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COUNTRIES } from "@/constants/data";
import { useColors } from "@/hooks/useColors";

export default function OnboardingCountry() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const top = isWeb ? 60 : insets.top;
  const bottom = isWeb ? 24 : insets.bottom;

  const [selected, setSelected] = useState<string | null>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === selected);

  const handleContinue = () => {
    if (!selectedCountry) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/onboarding/grade",
      params: {
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        language: selectedCountry.language,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, "#6366F1"]}
        style={[styles.header, { paddingTop: top + 20 }]}
      >
        <Text style={styles.stepLabel}>Step 1 of 4</Text>
        <Text style={styles.headerEmoji}>🌍</Text>
        <Text style={styles.headerTitle}>Where are you from?</Text>
        <Text style={styles.headerSub}>
          We'll set the language automatically for your country
        </Text>
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, i === 0 ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </LinearGradient>

      {/* Country grid */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {COUNTRIES.map((c) => {
            const isSelected = selected === c.code;
            return (
              <Pressable
                key={c.code}
                style={[
                  styles.countryCard,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelected(c.code);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={styles.countryFlag}>{c.flag}</Text>
                <Text
                  style={[
                    styles.countryName,
                    { color: isSelected ? "#fff" : colors.foreground },
                  ]}
                  numberOfLines={2}
                >
                  {c.name}
                </Text>
                {isSelected && (
                  <Text style={styles.langBadge}>{c.language}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue button */}
      <View style={[styles.footer, { paddingBottom: bottom + 16, backgroundColor: colors.background }]}>
        <Pressable
          onPress={handleContinue}
          disabled={!selected}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={selected ? [colors.primary, "#6366F1"] : ["#9CA3AF", "#6B7280"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueBtn}
          >
            <Text style={styles.continueBtnText}>
              {selected ? `Continue with ${selectedCountry?.language}` : "Select your country"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: "center",
    gap: 6,
  },
  stepLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  headerEmoji: { fontSize: 40, marginBottom: 4 },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: "#fff" },
  dotInactive: { backgroundColor: "rgba(255,255,255,0.35)" },
  scrollContent: { padding: 16 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  countryCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  countryFlag: { fontSize: 32 },
  countryName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  langBadge: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  continueBtn: {
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  continueBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
