import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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
import {
  getDifficultiesForLanguage,
  getLanguageForCountry,
  shouldUseGermanContent,
  type Difficulty,
} from "@/constants/data";
import { useProfile } from "@/context/ProfileContext";
import { useColors } from "@/hooks/useColors";
import { DifficultyIcon } from "@/components/DifficultyIcon";

export default function OnboardingDifficulty() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { saveProfile } = useProfile();
  const params = useLocalSearchParams<{
    name: string;
    countryCode: string;
    countryName: string;
    language: string;
    grade: string;
    subjects: string;
  }>();
  const isWeb = Platform.OS === "web";
  const top = isWeb ? 60 : insets.top;
  const bottom = isWeb ? 24 : insets.bottom;
  const language = getLanguageForCountry(params.countryCode, params.language);
  const isGerman = shouldUseGermanContent(language, params.countryCode);
  const difficulties = getDifficultiesForLanguage(language);
  const copy = isGerman
    ? {
        step: "Schritt 4 von 4",
        title: "Wie schwer soll es sein?",
        subtitle: "Wie schwierig sollen die Übungen im Vergleich zu deinen Schulaufgaben sein?",
        ritual: "Seite fotografieren → wir machen passende Übungen → dein Kind löst sie → du markierst ✓ oder ✗.",
        emptyCta: "Wähle einen Schwierigkeitsgrad",
        selectedCta: "Los geht's!",
      }
    : {
        step: "Step 4 of 4",
        title: "How hard should it be?",
        subtitle: "How difficult should the practice exercises be compared to your classwork?",
        ritual: "Snap a page → we make matching practice → your child works it out → you mark ✓ or ✗.",
        emptyCta: "Select a difficulty level",
        selectedCta: "Let's go!",
      };

  const [selected, setSelected] = useState<Difficulty | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    if (!selected) return;
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveProfile({
      name: params.name ?? "",
      countryCode: params.countryCode,
      countryName: params.countryName,
      language,
      grade: params.grade,
      subjects: params.subjects.split(",").filter(Boolean),
      difficulty: selected,
    });
    router.replace("/");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, "#6366F1"]}
        style={[styles.header, { paddingTop: top + 20 }]}
      >
        <Text style={styles.stepLabel}>{copy.step}</Text>
        <Text style={styles.headerEmoji}>⚡</Text>
        <Text style={styles.headerTitle}>{copy.title}</Text>
        <Text style={styles.headerSub}>{copy.subtitle}</Text>
        <Text style={styles.ritualSub}>{copy.ritual}</Text>
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.dotActive} />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {difficulties.map((d) => {
          const isSelected = selected === d.id;
          return (
            <Pressable
              key={d.id}
              style={[
                styles.diffCard,
                {
                  backgroundColor: isSelected ? d.color + "15" : colors.card,
                  borderColor: isSelected ? d.color : colors.border,
                },
              ]}
              onPress={() => {
                setSelected(d.id);
                Haptics.selectionAsync();
              }}
            >
              <View style={[styles.diffEmojiBg, { backgroundColor: d.color + "20" }]}>
                <DifficultyIcon
                  id={d.id}
                  size={26}
                  color={d.color}
                  weight={isSelected ? "fill" : "regular"}
                />
              </View>
              <View style={styles.diffText}>
                <Text style={[styles.diffLabel, { color: isSelected ? d.color : colors.foreground }]}>
                  {d.label}
                </Text>
                <Text style={[styles.diffDesc, { color: colors.mutedForeground }]}>
                  {d.desc}
                </Text>
              </View>
              {isSelected && (
                <View style={[styles.checkCircle, { backgroundColor: d.color }]}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + 16, backgroundColor: colors.background }]}>
        <Pressable
          onPress={handleFinish}
          disabled={!selected || isSaving}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={selected ? [colors.primary, "#6366F1"] : ["#9CA3AF", "#6B7280"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.finishBtn}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.finishBtnText}>
                {selected ? copy.selectedCta : copy.emptyCta}
              </Text>
            )}
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
  ritualSub: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 4,
  },
  dotsRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  dotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  scrollContent: { padding: 20, gap: 14 },
  diffCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 2,
    padding: 18,
    gap: 14,
  },
  diffEmojiBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  diffEmoji: { fontSize: 28 },
  diffText: { flex: 1, gap: 3 },
  diffLabel: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  diffDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { fontSize: 15, color: "#fff", fontFamily: "Inter_700Bold" },
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
  finishBtn: {
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  finishBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
