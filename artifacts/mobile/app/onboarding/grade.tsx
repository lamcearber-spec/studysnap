import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { getGradeGroupsForCountry } from "@/constants/data";
import { useColors } from "@/hooks/useColors";

export default function OnboardingGrade() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    countryCode: string;
    countryName: string;
    language: string;
  }>();
  const isWeb = Platform.OS === "web";
  const top = isWeb ? 60 : insets.top;
  const bottom = isWeb ? 24 : insets.bottom;
  const isGermany = params.countryCode === "DE";
  const language = isGermany ? "German" : params.language;
  const gradeGroups = getGradeGroupsForCountry(params.countryCode);
  const copy = isGermany
    ? {
        step: "Schritt 2 von 4",
        title: `Welche Klasse besuchst du${params.name ? `, ${params.name}` : ""}?`,
        subtitle: "Wir erstellen Übungen auf Deutsch und passend zu deinem Schulsystem",
        emptyCta: "Wähle deine Klasse",
        selectedCta: (grade: string) => `Weiter mit ${grade}`,
      }
    : {
        step: "Step 2 of 4",
        title: `What grade are you in${params.name ? `, ${params.name}` : ""}?`,
        subtitle: "We'll adjust exercises to your level",
        emptyCta: "Select your grade",
        selectedCta: (grade: string) => `Continue as ${grade}`,
      };

  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedGrade) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/onboarding/subjects",
      params: { ...params, language, grade: selectedGrade },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, "#6366F1"]}
        style={[styles.header, { paddingTop: top + 20 }]}
      >
        <Text style={styles.stepLabel}>{copy.step}</Text>
        <Text style={styles.headerEmoji}>🎒</Text>
        <Text style={styles.headerTitle}>{copy.title}</Text>
        <Text style={styles.headerSub}>{copy.subtitle}</Text>
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, i <= 1 ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {gradeGroups.map((group) => (
          <View key={group.label} style={styles.groupBlock}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
              {group.label}
            </Text>
            <View style={styles.gradesRow}>
              {group.grades.map((grade) => {
                const isSelected = selectedGrade === grade;
                return (
                  <Pressable
                    key={grade}
                    style={[
                      styles.gradeCard,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedGrade(grade);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[styles.gradeText, { color: isSelected ? "#fff" : colors.foreground }]}>
                      {grade}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + 16, backgroundColor: colors.background }]}>
        <Pressable
          onPress={handleContinue}
          disabled={!selectedGrade}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={selectedGrade ? [colors.primary, "#6366F1"] : ["#9CA3AF", "#6B7280"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueBtn}
          >
            <Text style={styles.continueBtnText}>
              {selectedGrade ? copy.selectedCta(selectedGrade) : copy.emptyCta}
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
  dotsRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: "#fff" },
  dotInactive: { backgroundColor: "rgba(255,255,255,0.35)" },
  scrollContent: { padding: 20, gap: 24 },
  groupBlock: { gap: 12 },
  groupLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  gradesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gradeCard: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    minWidth: "30%",
    alignItems: "center",
  },
  gradeText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
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
