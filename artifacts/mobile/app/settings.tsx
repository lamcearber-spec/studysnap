import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COUNTRIES,
  getDifficultiesForLanguage,
  getGradeGroupsForCountry,
  getSubjectsForLanguage,
  type Difficulty,
} from "@/constants/data";
import { useProfile } from "@/context/ProfileContext";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";
import { useGetUsage } from "@workspace/api-client-react";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile, clearProfile } = useProfile();
  const { tier, isSubscribed, appUserId, showManageSubscriptions } = useSubscription();
  const isWeb = Platform.OS === "web";
  const top = isWeb ? 67 : insets.top;
  const bottom = isWeb ? 24 : insets.bottom;
  const nameRef = useRef<TextInput>(null);

  const [name, setName] = useState<string>(profile?.name ?? "");
  const [subjects, setSubjects] = useState<string[]>(profile?.subjects ?? []);
  const [difficulty, setDifficulty] = useState<Difficulty>(profile?.difficulty ?? "same");
  const [grade, setGrade] = useState<string>(profile?.grade ?? "");
  const [isDirty, setIsDirty] = useState(false);

  const toggleSubject = (id: string) => {
    setSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setIsDirty(true);
    Haptics.selectionAsync();
  };

  const selectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    setIsDirty(true);
    Haptics.selectionAsync();
  };

  const selectGrade = (g: string) => {
    setGrade(g);
    setIsDirty(true);
    Haptics.selectionAsync();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter the student's name.");
      nameRef.current?.focus();
      return;
    }
    if (subjects.length === 0) {
      Alert.alert("No subjects", "Please select at least one subject.");
      return;
    }
    await updateProfile({ name: name.trim(), subjects, difficulty, grade });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Profile",
      "This will delete your profile and show the onboarding again. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await clearProfile();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const country = COUNTRIES.find((c) => c.code === profile?.countryCode);
  const gradeGroups = getGradeGroupsForCountry(profile?.countryCode);
  const subjectsList = getSubjectsForLanguage(profile?.language);
  const difficulties = getDifficultiesForLanguage(profile?.language);
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
      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Settings</Text>
        <Pressable
          onPress={handleSave}
          disabled={!isDirty}
          style={[styles.saveBtn, { opacity: isDirty ? 1 : 0.35 }]}
        >
          <Text style={[styles.saveBtnText, { color: colors.primary }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile info */}
        {profile && (
          <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "08"]}
              style={styles.profileGradient}
            >
              <Text style={styles.profileFlag}>{country?.flag ?? "🌍"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileName, { color: colors.foreground }]}>
                  {profile.countryName}
                </Text>
                <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>
                  {profile.language} · {profile.grade}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {isSubscribed && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Plan & usage</Text>
            <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planLabel, { color: colors.mutedForeground }]}>Current tier</Text>
                  <Text style={[styles.planTier, { color: colors.foreground }]}>
                    {tier === "premium" ? "Premium" : "Starter"}
                  </Text>
                </View>
                <Pressable onPress={() => router.push("/paywall")} style={styles.planLink}>
                  <Text style={[styles.planLinkText, { color: colors.primary }]}>Switch</Text>
                </Pressable>
              </View>

              {usage && (
                <>
                  <View style={[styles.usageTrack, { backgroundColor: colors.muted }]}>
                    <View style={[styles.usageFill, { backgroundColor: colors.primary, width: `${usagePct * 100}%` as any }]} />
                  </View>
                  <Text style={[styles.usageText, { color: colors.mutedForeground }]}>
                    {usage.used} / {usage.limit} images this month · resets {resetLabel}
                  </Text>
                </>
              )}

              <Pressable
                onPress={() => showManageSubscriptions()}
                style={[styles.manageButton, { borderColor: colors.border }]}
              >
                <Ionicons name="card-outline" size={17} color={colors.primary} />
                <Text style={[styles.manageText, { color: colors.primary }]}>Manage subscription</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Student name */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Student Name</Text>
          <Pressable
            style={[
              styles.nameInputWrap,
              {
                backgroundColor: colors.card,
                borderColor: name.trim() ? colors.primary : colors.border,
              },
            ]}
            onPress={() => nameRef.current?.focus()}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={name.trim() ? colors.primary : colors.mutedForeground}
            />
            <TextInput
              ref={nameRef}
              value={name}
              onChangeText={(v) => { setName(v); setIsDirty(true); }}
              placeholder="Student's name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.nameInput, { color: colors.foreground }]}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              maxLength={30}
            />
          </Pressable>
        </View>

        {/* Grade */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Grade</Text>
          {gradeGroups.map((group) => (
            <View key={group.label} style={styles.gradeGroup}>
              <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
                {group.label}
              </Text>
              <View style={styles.gradesRow}>
                {group.grades.map((g) => {
                  const isSelected = grade === g;
                  return (
                    <Pressable
                      key={g}
                      style={[
                        styles.gradeChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.muted,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => selectGrade(g)}
                    >
                      <Text style={[styles.gradeChipText, { color: isSelected ? "#fff" : colors.foreground }]}>
                        {g}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exercise Difficulty</Text>
          <View style={styles.diffList}>
            {difficulties.map((d) => {
              const isSelected = difficulty === d.id;
              return (
                <Pressable
                  key={d.id}
                  style={[
                    styles.diffRow,
                    {
                      backgroundColor: isSelected ? d.color + "12" : colors.card,
                      borderColor: isSelected ? d.color : colors.border,
                    },
                  ]}
                  onPress={() => selectDifficulty(d.id)}
                >
                  <Text style={styles.diffEmoji}>{d.emoji}</Text>
                  <View style={styles.diffText}>
                    <Text style={[styles.diffLabel, { color: isSelected ? d.color : colors.foreground }]}>
                      {d.label}
                    </Text>
                    <Text style={[styles.diffDesc, { color: colors.mutedForeground }]}>
                      {d.desc}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={d.color} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Subjects */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Subjects</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            {subjects.length} selected — tap to toggle
          </Text>
          <View style={styles.subjectsGrid}>
            {subjectsList.map((subject) => {
              const isSelected = subjects.includes(subject.id);
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
                  onPress={() => toggleSubject(subject.id)}
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
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Reset */}
        <Pressable
          onPress={handleReset}
          style={[styles.resetBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="refresh-outline" size={18} color="#EF4444" />
          <Text style={styles.resetText}>Reset profile & redo onboarding</Text>
        </Pressable>
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
  saveBtn: { paddingHorizontal: 4, height: 40, justifyContent: "center" },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 20, gap: 28 },
  profileCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  profileGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  profileFlag: { fontSize: 36 },
  profileName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  profileSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -6 },
  planCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  planTier: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 2 },
  planLink: { paddingHorizontal: 8, paddingVertical: 6 },
  planLinkText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  usageTrack: { height: 8, borderRadius: 999, overflow: "hidden" },
  usageFill: { height: "100%", borderRadius: 999 },
  usageText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  manageText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  gradeGroup: { gap: 8 },
  groupLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  gradesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  gradeChipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  diffList: { gap: 10 },
  diffRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  diffEmoji: { fontSize: 24 },
  diffText: { flex: 1 },
  diffLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  diffDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  subjectsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  subjectCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  subjectEmoji: { fontSize: 26 },
  subjectLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  nameInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    padding: 0,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  resetText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#EF4444" },
});
