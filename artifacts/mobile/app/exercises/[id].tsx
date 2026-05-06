import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExerciseCard } from "@/components/ExerciseCard";
import { useSession } from "@/context/SessionContext";
import { useColors } from "@/hooks/useColors";

export default function ExercisesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSession, updateSession, deleteSession } = useSession();
  const [revealed, setRevealed] = useState(false);

  const session = getSession(id);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const handleAnswer = useCallback(
    (exerciseId: string, answer: string) => {
      if (!session) return;
      const exercise = session.exercises.find((e) => e.id === exerciseId);
      if (!exercise || exercise.userAnswer) return;

      const isCorrect = exercise.answer?.toLowerCase().trim() === answer.toLowerCase().trim();
      const updatedExercises = session.exercises.map((e) =>
        e.id === exerciseId ? { ...e, userAnswer: answer, isCorrect } : e
      );

      const answeredCount = updatedExercises.filter((e) => e.userAnswer !== undefined).length;
      const correctCount = updatedExercises.filter((e) => e.isCorrect === true).length;

      updateSession({
        ...session,
        exercises: updatedExercises,
        totalAnswered: answeredCount,
        totalCorrect: correctCount,
      });

      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [session, updateSession]
  );

  const handleRevealAll = () => {
    setRevealed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = () => {
    Alert.alert("Delete Session", "Are you sure you want to delete this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteSession(id);
          router.replace("/");
        },
      },
    ]);
  };

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.navBar, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.replace("/")} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.foreground }]}>Session not found</Text>
        </View>
      </View>
    );
  }

  const answered = session.exercises.filter((e) => e.userAnswer !== undefined).length;
  const total = session.exercises.length;
  const accuracy = answered > 0 ? Math.round((session.totalCorrect / answered) * 100) : null;
  const isDone = answered === total;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View
        style={[
          styles.navBar,
          { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.replace("/")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.navCenter}>
          <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>
            {session.subject}
          </Text>
          <Text style={[styles.navSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {session.topic}
          </Text>
        </View>
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Source image + stats */}
        <View style={styles.heroRow}>
          <Image source={{ uri: session.imageUri }} style={styles.sourceThumbnail} contentFit="cover" />
          <View style={styles.statsColumn}>
            <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{answered}/{total}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Answered</Text>
            </View>
            {accuracy !== null && (
              <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: accuracy >= 70 ? colors.success : colors.accent }]}>
                  {accuracy}%
                </Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Accuracy</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(answered / total) * 100}%` as any,
                backgroundColor: isDone ? colors.success : colors.primary,
              },
            ]}
          />
        </View>

        {/* Done banner */}
        {isDone && (
          <View style={[styles.doneBanner, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
            <Ionicons name="trophy" size={20} color={colors.success} />
            <Text style={[styles.doneText, { color: colors.success }]}>
              {accuracy! >= 80
                ? "Excellent work! You nailed it!"
                : accuracy! >= 60
                ? "Good job! Keep practicing!"
                : "Keep going — practice makes perfect!"}
            </Text>
          </View>
        )}

        {/* Reveal button */}
        {!revealed && (
          <Pressable
            onPress={handleRevealAll}
            style={[styles.revealBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          >
            <Ionicons name="eye-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.revealText, { color: colors.mutedForeground }]}>Show all answers</Text>
          </Pressable>
        )}

        {/* Exercises */}
        {session.exercises.map((exercise, i) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            index={i}
            onAnswer={handleAnswer}
            revealed={revealed}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  deleteBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "flex-end" },
  navCenter: { flex: 1, alignItems: "center" },
  navTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  navSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scrollContent: { padding: 16, gap: 14 },
  heroRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  sourceThumbnail: {
    width: 90,
    height: 120,
    borderRadius: 12,
  },
  statsColumn: {
    flex: 1,
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLbl: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  doneBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  doneText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  revealBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  revealText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontSize: 17,
    fontFamily: "Inter_500Medium",
  },
});
