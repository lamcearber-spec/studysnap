import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Session } from "@/context/SessionContext";
import { useColors } from "@/hooks/useColors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SessionCardProps {
  session: Session;
}

function getSubjectColor(subject: string, colors: ReturnType<typeof useColors>) {
  const s = subject.toLowerCase();
  if (s.includes("math")) return colors.math;
  if (s.includes("science") || s.includes("biology") || s.includes("chemistry") || s.includes("physics")) return colors.science;
  if (s.includes("english") || s.includes("language") || s.includes("literature")) return colors.english;
  if (s.includes("history") || s.includes("social")) return colors.history;
  if (s.includes("art") || s.includes("music")) return colors.art;
  return colors.other;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getReviewCounts(session: Session) {
  const total = session.exercises.length;
  const hasStatuses = session.exercises.some((exercise) => exercise.status !== undefined);
  if (!hasStatuses) {
    const answered = Math.min(total, Math.max(0, session.totalAnswered));
    const correct = Math.min(answered, Math.max(0, session.totalCorrect));
    return { answered, correct, pending: Math.max(0, total - answered) };
  }

  const correct = session.exercises.filter((exercise) => exercise.status === "correct").length;
  const wrong = session.exercises.filter((exercise) => exercise.status === "wrong").length;
  return { answered: correct + wrong, correct, pending: Math.max(0, total - correct - wrong) };
}

export function SessionCard({ session }: SessionCardProps) {
  const colors = useColors();
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const subjectColor = getSubjectColor(session.subject, colors);
  const review = getReviewCounts(session);
  const progress = session.exercises.length > 0 ? review.answered / session.exercises.length : 0;
  const accuracy = review.answered > 0 ? Math.round((review.correct / review.answered) * 100) : null;

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={() => router.push(`/exercises/${session.id}`)}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image
          source={{ uri: session.imageUri }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.content}>
          <View style={[styles.subjectBadge, { backgroundColor: subjectColor + "20" }]}>
            <Text style={[styles.subjectText, { color: subjectColor }]}>{session.subject}</Text>
          </View>
          <Text style={[styles.topic, { color: colors.foreground }]} numberOfLines={2}>
            {session.topic}
          </Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="help-circle-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {session.exercises.length} exercises
              </Text>
            </View>
            {accuracy !== null && (
              <View style={styles.metaItem}>
                <Ionicons name="trophy-outline" size={13} color={colors.accent} />
                <Text style={[styles.metaText, { color: colors.accent }]}>{accuracy}%</Text>
              </View>
            )}
            {accuracy === null && (
              <View style={styles.metaItem}>
                <Ionicons name="ellipse-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  Awaiting review
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {formatDate(session.createdAt)}
              </Text>
            </View>
          </View>
          {progress > 0 && (
            <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: subjectColor }]} />
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  thumbnail: {
    width: 90,
    height: 100,
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 5,
  },
  subjectBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  topic: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 19,
  },
  meta: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
