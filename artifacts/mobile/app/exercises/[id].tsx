import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
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
import { C, F } from "@/app/_components/tokens";
import { ExerciseCard } from "@/components/ExerciseCard";
import { useSession } from "@/context/SessionContext";

const isWeb = Platform.OS === "web";

export default function ExercisesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSession, deleteSession } = useSession();
  const session = getSession(id);
  const topPad = isWeb ? 56 : insets.top;
  const bottomPad = isWeb ? 28 : insets.bottom;

  const handleDelete = () => {
    Alert.alert("Delete session", "Delete this worksheet session?", [
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
      <View style={[styles.screen, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace("/")} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={C.ink} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={C.inkMuted} />
          <Text style={styles.notFoundText}>Session not found</Text>
        </View>
      </View>
    );
  }

  const correctCount = session.exercises.filter((exercise) => exercise.status === "correct").length;
  const wrongCount = session.exercises.filter((exercise) => exercise.status === "wrong").length;
  const pendingCount = Math.max(0, session.exercises.length - correctCount - wrongCount);

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace("/")}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <Ionicons name="arrow-back" size={24} color={C.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerKicker}>WORKSHEET</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Worksheet · {session.topic}
          </Text>
        </View>
        <Pressable
          onPress={handleDelete}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Delete session"
        >
          <Ionicons name="trash-outline" size={21} color={C.error} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 28 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.contextCard}>
          <Text style={styles.contextKicker}>{session.subject}</Text>
          <Text style={styles.contextTitle}>{session.grade ?? "Practice worksheet"}</Text>
          <Text style={styles.contextBody}>
            Work through the questions, then mark each one together with ✓ or ✗.
          </Text>
        </View>

        <View style={styles.exerciseList}>
          {session.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              sessionId={session.id}
              index={index}
              total={session.exercises.length}
            />
          ))}
        </View>

        <View style={styles.footerCard}>
          <View style={styles.summaryRow}>
            <SummaryPill icon="checkmark" color={C.primary} value={correctCount} label="correct" />
            <SummaryPill icon="close" color={C.error} value={wrongCount} label="wrong" />
            <SummaryPill icon="ellipse-outline" color={C.inkMuted} value={pendingCount} label="pending" />
          </View>
          <Pressable
            onPress={() => {
              if (!isWeb) Haptics.selectionAsync();
              router.replace("/");
            }}
            style={styles.doneWrap}
            accessibilityRole="button"
          >
            <View style={styles.doneLedge} />
            <View style={styles.doneFace}>
              <Text style={styles.doneText}>Done</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryPill({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.summaryPill}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
    backgroundColor: C.surface,
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 1,
  },
  headerKicker: {
    fontFamily: F.bodyBold,
    fontSize: 10,
    color: C.inkMuted,
    letterSpacing: 1.3,
  },
  headerTitle: {
    fontFamily: F.displaySemi,
    fontSize: 17,
    lineHeight: 23,
    color: C.ink,
    letterSpacing: 0,
    maxWidth: "100%",
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  contextCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.hairline,
    padding: 14,
    gap: 4,
    boxShadow: "0 2px 0 rgba(27, 28, 28, 0.06)",
  },
  contextKicker: {
    fontFamily: F.bodyBold,
    fontSize: 11,
    color: C.primary,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  contextTitle: {
    fontFamily: F.displaySemi,
    fontSize: 18,
    color: C.ink,
    letterSpacing: 0,
  },
  contextBody: {
    fontFamily: F.bodyMedium,
    fontSize: 13,
    lineHeight: 19,
    color: C.inkBody,
  },
  exerciseList: {
    gap: 16,
  },
  footerCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.hairline,
    padding: 14,
    gap: 14,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: C.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 6,
  },
  summaryValue: {
    fontFamily: F.bodyBold,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  summaryLabel: {
    fontFamily: F.bodySemi,
    fontSize: 12,
    color: C.inkMuted,
  },
  doneWrap: {
    minHeight: 54,
  },
  doneLedge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    borderRadius: 12,
    backgroundColor: C.primaryShadow,
  },
  doneFace: {
    minHeight: 50,
    borderRadius: 12,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
  },
  doneText: {
    fontFamily: F.displaySemi,
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontFamily: F.bodySemi,
    fontSize: 17,
    color: C.ink,
  },
});
