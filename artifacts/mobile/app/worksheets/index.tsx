import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter, Stack } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession, type Session } from "@/context/SessionContext";
import { useProfile } from "@/context/ProfileContext";
import { getSubjectLabel } from "@/constants/data";
import { C, F } from "@/app/_components/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const isWeb = Platform.OS === "web";

type Counts = { total: number; answered: number; correct: number; pending: number };

function getCounts(session: Session): Counts {
  const total = session.exercises.length;
  const hasStatuses = session.exercises.some((e) => e.status !== undefined);
  if (!hasStatuses) {
    const answered = Math.min(total, Math.max(0, session.totalAnswered));
    const correct = Math.min(answered, Math.max(0, session.totalCorrect));
    return { total, answered, correct, pending: Math.max(0, total - answered) };
  }
  const correct = session.exercises.filter((e) => e.status === "correct").length;
  const wrong = session.exercises.filter((e) => e.status === "wrong").length;
  return { total, answered: correct + wrong, correct, pending: Math.max(0, total - (correct + wrong)) };
}

function relativeDate(d: Date): string {
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.round(h / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function WorksheetCard({
  session,
  onPress,
  language,
}: {
  session: Session;
  onPress: () => void;
  language?: string;
}) {
  const counts = getCounts(session);
  const pct = counts.answered === 0 ? 0 : Math.round((counts.correct / counts.answered) * 100);
  const isComplete = counts.pending === 0 && counts.total > 0;
  const isPerfect = isComplete && pct === 100;
  const title = session.title?.trim() || session.topic?.trim() || getSubjectLabel(session.subject, language);
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={[styles.card, style]}
      onPressIn={() => { scale.value = withSpring(0.98, { stiffness: 320, damping: 20 }); }}
      onPressOut={() => { scale.value = withSpring(1, { stiffness: 320, damping: 20 }); }}
      onPress={() => {
        if (!isWeb) Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${counts.correct} of ${counts.total} correct`}
    >
      <View style={styles.thumb}>
        {session.imageUri ? (
          <Image source={{ uri: session.imageUri }} style={styles.thumbImage} contentFit="cover" />
        ) : (
          <View style={styles.thumbFallback}>
            <Ionicons name="image-outline" size={28} color={C.inkMuted} />
          </View>
        )}
        {isPerfect && (
          <View style={styles.perfectBadge}>
            <Text style={styles.perfectBadgeText}>100%</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.cardMeta}>{relativeDate(new Date(session.createdAt))} · {counts.total} exercises</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(4, (counts.answered / Math.max(1, counts.total)) * 100)}%`,
                backgroundColor: isPerfect ? C.yellow : C.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.cardStat}>
          {counts.pending > 0
            ? `${counts.pending} left`
            : `${counts.correct}/${counts.total} correct · ${pct}%`}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export default function WorksheetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessions, isLoading } = useSession();
  const { profile } = useProfile();

  const grouped = useMemo(() => {
    const ranges = {
      today: [] as Session[],
      week: [] as Session[],
      earlier: [] as Session[],
    };
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    for (const s of sessions) {
      const created = new Date(s.createdAt);
      const ageDays = (now.getTime() - created.getTime()) / dayMs;
      if (ageDays < 1) ranges.today.push(s);
      else if (ageDays < 7) ranges.week.push(s);
      else ranges.earlier.push(s);
    }
    return ranges;
  }, [sessions]);

  const topPad = isWeb ? 56 : insets.top;

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color={C.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>My worksheets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {!isLoading && sessions.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="folder-outline" size={36} color={C.primary} />
            </View>
            <Text style={styles.emptyTitle}>No worksheets yet</Text>
            <Text style={styles.emptyBody}>Snap a page to make your first worksheet.</Text>
          </View>
        )}

        {grouped.today.length > 0 && (
          <Section title="Today">
            {grouped.today.map((s) => (
              <WorksheetCard
                key={s.id}
                session={s}
                language={profile?.language}
                onPress={() => router.push(`/exercises/${s.id}`)}
              />
            ))}
          </Section>
        )}

        {grouped.week.length > 0 && (
          <Section title="This week">
            {grouped.week.map((s) => (
              <WorksheetCard
                key={s.id}
                session={s}
                language={profile?.language}
                onPress={() => router.push(`/exercises/${s.id}`)}
              />
            ))}
          </Section>
        )}

        {grouped.earlier.length > 0 && (
          <Section title="Earlier">
            {grouped.earlier.map((s) => (
              <WorksheetCard
                key={s.id}
                session={s}
                language={profile?.language}
                onPress={() => router.push(`/exercises/${s.id}`)}
              />
            ))}
          </Section>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.kickerRow}>
        <View style={styles.kickerPip} />
        <Text style={styles.kicker}>{title.toUpperCase()}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.surface },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.primaryBorderTint,
  },
  headerTitle: {
    fontFamily: F.display,
    fontSize: 18,
    color: C.ink,
    letterSpacing: -0.3,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 24 },
  section: { gap: 12 },
  sectionBody: { gap: 10 },
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  kickerPip: { width: 6, height: 6, borderRadius: 999, backgroundColor: C.primary },
  kicker: {
    fontFamily: F.bodyBold,
    fontSize: 11,
    color: C.inkMuted,
    letterSpacing: 1.4,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.hairline,
    padding: 12,
  },
  thumb: {
    width: 72,
    height: 96,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: C.surfaceLow,
    position: "relative",
  },
  thumbImage: { width: "100%", height: "100%" },
  thumbFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  perfectBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: C.yellowDeep,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  perfectBadgeText: {
    fontFamily: F.bodyBold,
    fontSize: 9,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  cardBody: { flex: 1, justifyContent: "center", gap: 4 },
  cardTitle: {
    fontFamily: F.displaySemi,
    fontSize: 16,
    color: C.ink,
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontFamily: F.body,
    fontSize: 12,
    color: C.inkMuted,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: C.surfaceHigh,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999 },
  cardStat: {
    fontFamily: F.bodySemi,
    fontSize: 12,
    color: C.inkBody,
    marginTop: 2,
  },
  empty: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.hairline,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: C.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.primaryBorderTint,
  },
  emptyTitle: {
    fontFamily: F.displaySemi,
    fontSize: 18,
    color: C.ink,
  },
  emptyBody: {
    fontFamily: F.body,
    fontSize: 13,
    color: C.inkBody,
    textAlign: "center",
  },
});
