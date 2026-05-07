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
import {
  getLanguageForCountry,
  getSubjectsForLanguage,
  shouldUseGermanContent,
} from "@/constants/data";
import { useColors } from "@/hooks/useColors";

export default function OnboardingSubjects() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    countryCode: string;
    countryName: string;
    language: string;
    grade: string;
  }>();
  const isWeb = Platform.OS === "web";
  const top = isWeb ? 60 : insets.top;
  const bottom = isWeb ? 24 : insets.bottom;
  const language = getLanguageForCountry(params.countryCode, params.language);
  const isGerman = shouldUseGermanContent(language, params.countryCode);
  const subjects = getSubjectsForLanguage(language);
  const copy = isGerman
    ? {
        step: "Schritt 3 von 4",
        title: "Was lernst du?",
        subtitle: "Wähle alle Fächer aus, für die du üben möchtest. Du kannst das später ändern.",
        count: (amount: number) => `${amount} ${amount === 1 ? "Fach" : "Fächer"} ausgewählt`,
        emptyCta: "Wähle mindestens ein Fach",
        selectedCta: "Weiter",
      }
    : {
        step: "Step 3 of 4",
        title: "What do you study?",
        subtitle: "Pick all the subjects you want practice for. You can change this later.",
        count: (amount: number) => `${amount} subject${amount > 1 ? "s" : ""} selected`,
        emptyCta: "Select at least one subject",
        selectedCta: "Continue",
      };

  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    Haptics.selectionAsync();
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/onboarding/difficulty",
      params: { ...params, language, subjects: selected.join(",") },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, "#6366F1"]}
        style={[styles.header, { paddingTop: top + 20 }]}
      >
        <Text style={styles.stepLabel}>{copy.step}</Text>
        <Text style={styles.headerEmoji}>📚</Text>
        <Text style={styles.headerTitle}>{copy.title}</Text>
        <Text style={styles.headerSub}>{copy.subtitle}</Text>
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, i <= 2 ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {subjects.map((subject) => {
            const isSelected = selected.includes(subject.id);
            return (
              <Pressable
                key={subject.id}
                style={[
                  styles.subjectCard,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggle(subject.id)}
              >
                <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
                <Text
                  style={[
                    styles.subjectLabel,
                    { color: isSelected ? "#fff" : colors.foreground },
                  ]}
                  numberOfLines={2}
                >
                  {subject.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkDot} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + 16, backgroundColor: colors.background }]}>
        {selected.length > 0 && (
          <Text style={[styles.selectionCount, { color: colors.mutedForeground }]}>
            {copy.count(selected.length)}
          </Text>
        )}
        <Pressable
          onPress={handleContinue}
          disabled={selected.length === 0}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={selected.length > 0 ? [colors.primary, "#6366F1"] : ["#9CA3AF", "#6B7280"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueBtn}
          >
            <Text style={styles.continueBtnText}>
              {selected.length > 0 ? copy.selectedCta : copy.emptyCta}
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
  scrollContent: { padding: 16 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  subjectCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  subjectEmoji: { fontSize: 30 },
  subjectLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  checkDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.7)",
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
    gap: 6,
  },
  selectionCount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
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
