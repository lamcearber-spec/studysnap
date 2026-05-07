import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

const isWeb = Platform.OS === "web";

export default function UserSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile, clearProfile } = useProfile();
  const top = isWeb ? 67 : insets.top;
  const bottom = isWeb ? 24 : insets.bottom;
  const nameRef = useRef<TextInput>(null);

  const [name, setName] = useState<string>(profile?.name ?? "");
  const [countryCode, setCountryCode] = useState<string>(profile?.countryCode ?? "");
  const [subjects, setSubjects] = useState<string[]>(profile?.subjects ?? []);
  const [difficulty, setDifficulty] = useState<Difficulty>(profile?.difficulty ?? "same");
  const [grade, setGrade] = useState<string>(profile?.grade ?? "");
  const [isDirty, setIsDirty] = useState(false);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);
  const selectedLanguage = selectedCountry?.language ?? profile?.language ?? "English";
  const gradeGroups = getGradeGroupsForCountry(countryCode);
  const subjectsList = getSubjectsForLanguage(selectedLanguage);
  const difficulties = getDifficultiesForLanguage(selectedLanguage);

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

  const selectCountry = (code: string) => {
    const next = COUNTRIES.find((c) => c.code === code);
    if (!next) return;
    setCountryCode(code);
    setIsDirty(true);
    const nextGroups = getGradeGroupsForCountry(code);
    const allGrades: string[] = nextGroups.flatMap((g) => [...g.grades]);
    if (grade && !allGrades.includes(grade)) setGrade("");
    const nextSubjects = getSubjectsForLanguage(next.language);
    const validIds = new Set<string>(nextSubjects.map((s) => s.id));
    setSubjects((prev) => prev.filter((id) => validIds.has(id)));
    Haptics.selectionAsync();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter the student's name.");
      nameRef.current?.focus();
      return;
    }
    if (!countryCode || !selectedCountry) {
      Alert.alert("Country required", "Please select a country.");
      return;
    }
    if (subjects.length === 0) {
      Alert.alert("No subjects", "Please select at least one subject.");
      return;
    }
    await updateProfile({
      name: name.trim(),
      countryCode,
      countryName: selectedCountry.name,
      language: selectedCountry.language,
      subjects,
      difficulty,
      grade,
    });
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>User</Text>
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
        {/* Student Name */}
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

        {/* Country */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Country</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Sets the language and curriculum for exercises
          </Text>
          <View style={styles.countryGrid}>
            {COUNTRIES.map((c) => {
              const isSelected = countryCode === c.code;
              return (
                <Pressable
                  key={c.code}
                  style={[
                    styles.countryChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => selectCountry(c.code)}
                >
                  <Text style={styles.countryFlag}>{c.flag}</Text>
                  <Text
                    style={[styles.countryChipName, { color: isSelected ? "#fff" : colors.foreground }]}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
                    style={[styles.subjectLabel, { color: isSelected ? "#fff" : colors.foreground }]}
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
  section: { gap: 14 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -6 },
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
  countryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  countryChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  countryFlag: { fontSize: 18 },
  countryChipName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
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
