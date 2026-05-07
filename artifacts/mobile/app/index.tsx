import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfile } from "@/context/ProfileContext";
import { useSession } from "@/context/SessionContext";
import { getDifficultiesForLanguage, getSubjectEmoji, getSubjectLabel } from "@/constants/data";
import { hasFreeScanAvailableToday } from "@/lib/freeScans";
import { useSubscription } from "@/lib/revenuecat";
import { useGetUsage, type Quota } from "@workspace/api-client-react";
import { C, F } from "@/app/_components/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const isWeb = Platform.OS === "web";

function getGreeting(name?: string): { text: string; emoji: string } {
  const hour = new Date().getHours();
  const first = name?.split(" ")[0] ?? "friend";
  if (hour < 12) return { text: `Good morning, ${first}`, emoji: "☀️" };
  if (hour < 17) return { text: `Good afternoon, ${first}`, emoji: "👋" };
  return { text: `Good evening, ${first}`, emoji: "🌙" };
}

// Tactile primary CTA. The signature interaction:
//   - `ctaLedge` (z=0, abs bottom:0, height 4) is the dark green "ridge."
//   - `ctaFace` (z=1, marginBottom 4) sits above the ledge.
//   - Press → face translateY +2px + ledge height 4→2px = "key pressed" feel.
function ScanCTA() {
  const router = useRouter();
  const { sessions } = useSession();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const press = useSharedValue(0);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(press.value, [0, 1], [0, 2]) }],
  }));
  const ledgeStyle = useAnimatedStyle(() => ({
    height: interpolate(press.value, [0, 1], [4, 2]),
  }));

  const onPress = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!subscriptionLoading && !isSubscribed && !hasFreeScanAvailableToday(sessions)) {
      router.push("/paywall");
      return;
    }
    router.push("/scan");
  };

  return (
    <View style={styles.ctaWrap}>
      <Animated.View pointerEvents="none" style={[styles.ctaLedge, ledgeStyle]} />
      <AnimatedPressable
        style={[styles.ctaFace, faceStyle]}
        onPressIn={() => { press.value = withTiming(1, { duration: 60 }); }}
        onPressOut={() => { press.value = withSpring(0, { stiffness: 320, damping: 20 }); }}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Scan classwork"
      >
        <View style={styles.ctaIconWrap}>
          <Ionicons name="camera" size={30} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>Scan classwork</Text>
          <Text style={styles.ctaSub}>Snap a page · we'll make matching practice.</Text>
        </View>
        <Ionicons name="arrow-forward" size={22} color="rgba(255,255,255,0.85)" />
      </AnimatedPressable>
    </View>
  );
}

function StreakCard({ streak, doneToday, totalToday }: {
  streak: number; doneToday: number; totalToday: number;
}) {
  const safeTotal = Math.max(1, totalToday);
  const pctRaw = doneToday / safeTotal;
  const pct = Math.min(1, pctRaw);
  const fillStyle = pctRaw === 0
    ? { width: 6 as const, opacity: 0.4 }
    : { width: `${pct * 100}%` as const, opacity: 1 };
  return (
    <View>
      <View style={styles.kickerRow}>
        <View style={styles.kickerPip} />
        <Text style={styles.kicker}>DAILY HABIT</Text>
      </View>
      <View style={styles.streakCard}>
        <View style={styles.streakFlame}>
          <Text style={{ fontSize: 26 }}>🔥</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakNumber}>
            {streak}{" "}
            <Text style={styles.streakNumberUnit}>day{streak === 1 ? "" : "s"} in a row</Text>
          </Text>
          <View style={styles.streakBarTrack}>
            <View style={[styles.streakBarFill, fillStyle]} />
          </View>
          <Text style={styles.streakSub}>
            {doneToday}/{totalToday} exercises today{pct === 1 ? " · done!" : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}

function UsageChip({ quota, streak }: { quota: Quota; streak: number }) {
  const usedPct = quota.limit <= 0 ? 0 : Math.min(1, quota.used / quota.limit);
  const filledBlocks = Math.round(usedPct * 10);
  const usageBlocks = Array.from({ length: 10 }, (_, index) => index < filledBlocks ? "█" : "░").join("");
  const resetLabel = new Date(quota.resetAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <View>
      <View style={styles.kickerRow}>
        <View style={styles.kickerPip} />
        <Text style={styles.kicker}>DAILY HABIT</Text>
      </View>
      <View style={styles.usageChip}>
        <Text style={styles.usageHeadline}>🔥 {streak} days in a row</Text>
        <Text style={styles.usageBlocks}>{usageBlocks}</Text>
        <Text style={styles.usageMeta}>
          {quota.used} / {quota.limit} images this month · resets {resetLabel}
        </Text>
      </View>
    </View>
  );
}

function StatTrio({ sessions, exercises, accuracy }: {
  sessions: number; exercises: number; accuracy: number | null;
}) {
  return (
    <View style={styles.statRow}>
      <StatCard label="SESSIONS" value={String(sessions)} valueColor={C.primary} />
      <StatCard label="EXERCISES" value={String(exercises)} valueColor={C.yellowDeep} />
      <StatCard label="ACCURACY" value={accuracy === null ? "—" : `${accuracy}%`} valueColor={C.primaryDark} />
    </View>
  );
}

function StatCard({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  return (
    <View style={styles.statCard}>
      <Text
        style={[styles.statValue, { color: valueColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Trophy row — tactile, three-tier (PERFECT / HIGH / REGULAR), pressable.
function TrophyRow({
  emoji, title, correct, total, dateLabel, onPress,
}: {
  emoji: string; title: string; correct: number; total: number; dateLabel: string;
  onPress: () => void;
}) {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  const isPerfect = pct === 100;
  const isHigh = !isPerfect && pct >= 80;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const cardStyle = [
    styles.trophyCard,
    isPerfect && styles.trophyCardPerfect,
    animatedStyle,
  ];
  const emojiWrapStyle = [
    styles.trophyEmojiWrap,
    isPerfect && styles.trophyEmojiWrapPerfect,
    isHigh && styles.trophyEmojiWrapHigh,
  ];

  return (
    <AnimatedPressable
      style={cardStyle}
      onPressIn={() => { scale.value = withSpring(0.98, { stiffness: 320, damping: 20 }); }}
      onPressOut={() => { scale.value = withSpring(1, { stiffness: 320, damping: 20 }); }}
      onPress={() => {
        if (!isWeb) Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${correct} of ${total} correct, ${pct} percent, ${dateLabel}`}
    >
      {isHigh && <View style={styles.trophyLeftRail} />}
      <View style={emojiWrapStyle}>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.trophyTitleRow}>
          <Text style={styles.trophyTitle} numberOfLines={1}>{title}</Text>
          {isPerfect && (
            <View style={styles.perfectPill}>
              <Text style={styles.perfectPillText}>PERFECT</Text>
            </View>
          )}
        </View>
        <Text style={styles.trophyMeta}>
          <Text style={[
            styles.trophyCorrect,
            isPerfect && { color: C.yellowDeep },
            isHigh && { color: C.primary },
          ]}>
            {correct}/{total} correct
          </Text>
          <Text style={styles.trophyMetaDim}>{"  ·  "}{pct}%</Text>
          <Text style={styles.trophyMetaDim}>{"  ·  "}{dateLabel}</Text>
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.inkMuted} />
    </AnimatedPressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyCard}>
      {/* The icon ring is intentionally a circle (borderRadius 999) — the only
          non-12px-radius element on the screen. It functions as a focal
          illustration anchor, not a structural surface, and stays consistent
          with the rest of the system at the level of "rounded-soft" intent. */}
      <View style={styles.emptyIconRing}>
        <Ionicons name="book-outline" size={42} color={C.primary} />
      </View>
      <Text style={styles.emptyTitle}>Your first session is one tap away.</Text>
      <Text style={styles.emptyBody}>
        Snap a page from your notebook or textbook. We'll make a parallel worksheet you can do in five minutes.
      </Text>
    </View>
  );
}

function SubjectChip({ id, language }: { id: string; language?: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipEmoji}>{getSubjectEmoji(id)}</Text>
      <Text style={styles.chipLabel}>{getSubjectLabel(id, language)}</Text>
    </View>
  );
}

function ProfileStrip({
  grade, difficultyLabel, difficultyEmoji, subjects, language,
}: {
  grade: string; difficultyLabel: string; difficultyEmoji: string; subjects: string[]; language?: string;
}) {
  return (
    <View style={styles.profileStrip}>
      <View style={styles.profileMetaItem}>
        <Text style={styles.profileMetaEmoji}>🎒</Text>
        <Text style={styles.profileMetaText}>{grade}</Text>
      </View>
      <View style={styles.stripDivider} />
      <View style={styles.profileMetaItem}>
        <Text style={styles.profileMetaEmoji}>{difficultyEmoji}</Text>
        <Text style={styles.profileMetaText}>{difficultyLabel}</Text>
      </View>
      <View style={styles.stripDivider} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subjectsRow}
        nestedScrollEnabled
        style={{ flex: 1 }}
      >
        {subjects.slice(0, 5).map((id) => <SubjectChip key={id} id={id} language={language} />)}
        {subjects.length > 5 && (
          <View style={[styles.chip, styles.chipOverflow]}>
            <Text style={[styles.chipLabel, { color: C.inkMuted }]}>+{subjects.length - 5}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SettingsButton() {
  const router = useRouter();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={[styles.settingsButton, animatedStyle]}
      onPressIn={() => { scale.value = withSpring(0.92); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={() => router.push("/settings")}
      accessibilityRole="button"
      accessibilityLabel="Open settings"
    >
      <Ionicons name="settings-outline" size={22} color={C.primary} />
    </AnimatedPressable>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.kickerRow}>
        <View style={styles.kickerPip} />
        <Text style={styles.kicker}>{kicker}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sessions, isLoading } = useSession();
  const { profile } = useProfile();
  const { isSubscribed, appUserId } = useSubscription();

  const topPad = isWeb ? 56 : insets.top;
  const bottomPad = isWeb ? 28 : insets.bottom;
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

  const greeting = getGreeting(profile?.name);
  const difficulties = getDifficultiesForLanguage(profile?.language);
  const difficultyInfo = difficulties.find((d) => d.id === profile?.difficulty);
  const totalCorrect = sessions.reduce((sum, s) => sum + s.totalCorrect, 0);
  const totalExercises = sessions.reduce((sum, s) => sum + s.exercises.length, 0);
  const accuracy = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : null;

  const streak = computeStreak(sessions.map((s) => s.createdAt));
  const todaysExercises = sessions
    .filter((s) => isSameDay(new Date(s.createdAt), new Date()))
    .reduce((sum, s) => sum + s.exercises.length, 0);

  React.useEffect(() => {
    if (isSubscribed && appUserId) {
      usageQuery.refetch();
    }
  }, [appUserId, isSubscribed, sessions.length]);

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              {greeting.text} {greeting.emoji}
            </Text>
            <Text style={styles.brand}>StudySnap</Text>
          </View>
          <SettingsButton />
        </View>

        {/* Profile chip strip */}
        {profile && (
          <ProfileStrip
            grade={profile.grade ?? "Grade —"}
            difficultyLabel={difficultyInfo?.label ?? "Same level"}
            difficultyEmoji={difficultyInfo?.emoji ?? "⚡"}
            subjects={profile.subjects ?? []}
            language={profile.language}
          />
        )}

        {isSubscribed && usageQuery.data && (
          <UsageChip quota={usageQuery.data} streak={streak} />
        )}

        {/* Hero CTA */}
        <ScanCTA />

        {/* Streak (post-first-session only) */}
        {sessions.length > 0 && !usageQuery.data && (
          <StreakCard
            streak={streak}
            doneToday={todaysExercises}
            totalToday={Math.max(8, todaysExercises)}
          />
        )}

        {/* Stats */}
        {sessions.length > 0 && (
          <View>
            <SectionHead kicker="YOUR PROGRESS" title="The shelf so far" />
            <StatTrio sessions={sessions.length} exercises={totalExercises} accuracy={accuracy} />
          </View>
        )}

        {/* Trophy shelf */}
        {sessions.length > 0 && (
          <View>
            <SectionHead kicker="RECENT" title="Trophy shelf" />
            <View style={{ gap: 12 }}>
              {sessions.slice(0, 5).map((session) => (
                <TrophyRow
                  key={session.id}
                  emoji={getSubjectEmoji(session.subject)}
                  title={session.topic || getSubjectLabel(session.subject, profile?.language)}
                  correct={session.totalCorrect}
                  total={session.exercises.length}
                  dateLabel={relativeDate(new Date(session.createdAt))}
                  onPress={() => router.push(`/exercises/${session.id}`)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty */}
        {!isLoading && sessions.length === 0 && <EmptyState />}
      </ScrollView>
    </View>
  );
}

// === Helpers ===============================================================
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
function pad(n: number) { return String(n).padStart(2, "0"); }
function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function computeStreak(timestamps: Array<string | number | Date>): number {
  if (timestamps.length === 0) return 0;
  const days = new Set(timestamps.map((t) => dayKey(new Date(t))));
  let count = 0;
  const cur = new Date();
  for (;;) {
    if (!days.has(dayKey(cur))) break;
    count++;
    cur.setDate(cur.getDate() - 1);
  }
  return count;
}
function relativeDate(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24 && isSameDay(d, now)) return `${diffH}h ago`;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

// === Styles ================================================================
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.surface },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 24 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontFamily: F.bodySemi,
    fontSize: 14,
    color: C.inkMuted,
    letterSpacing: 0,
    marginBottom: 4,
  },
  brand: {
    fontFamily: F.display,
    fontSize: 32,
    color: C.ink,
    letterSpacing: -0.6,
  },
  settingsButton: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: C.primaryTint,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.primaryBorderTint,
  },

  profileStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1, borderColor: C.hairline,
    paddingVertical: 12, paddingHorizontal: 12,
    gap: 12,
    minHeight: 56,
    ...shadow(2),
  },
  profileMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  profileMetaEmoji: { fontSize: 16 },
  profileMetaText: { fontFamily: F.bodyMedium, fontSize: 13, color: C.ink },
  stripDivider: { width: 1, height: 18, backgroundColor: C.hairline },
  subjectsRow: { flexDirection: "row", gap: 6, alignItems: "center", paddingRight: 4 },

  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: C.primaryTint,
    borderWidth: 1, borderColor: C.primaryBorderTint,
  },
  chipOverflow: { backgroundColor: C.surfaceLow, borderColor: C.hairline },
  chipEmoji: { fontSize: 12 },
  chipLabel: { fontFamily: F.bodySemi, fontSize: 12, color: C.primaryDark, letterSpacing: 0.1 },

  // CTA — layered geometry: ledge (z=0) + face (z=1)
  ctaWrap: { position: "relative", overflow: "visible" },
  ctaLedge: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    backgroundColor: C.primaryShadow,
    borderRadius: 14,
    height: 4,
    zIndex: 0,
    elevation: 0,
  },
  ctaFace: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 18,
    marginBottom: 4,
    zIndex: 1,
  },
  ctaIconWrap: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center", justifyContent: "center",
  },
  ctaTitle: {
    fontFamily: F.display, fontSize: 22, color: "#fff", letterSpacing: -0.4,
  },
  ctaSub: {
    fontFamily: F.bodyMedium, fontSize: 14, color: "rgba(255,255,255,0.82)",
    marginTop: 2,
  },

  // Kicker pattern
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  kickerPip: { width: 6, height: 6, borderRadius: 999, backgroundColor: C.primary },
  kicker: {
    fontFamily: F.bodyBold, fontSize: 11, color: C.inkMuted, letterSpacing: 1.4,
  },

  // Streak
  streakCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1, borderColor: C.hairline,
    padding: 16,
    ...shadow(2),
  },
  streakFlame: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: C.yellowSoft,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(116,91,0,0.18)",
  },
  streakNumber: {
    fontFamily: F.display, fontSize: 26, color: C.ink, letterSpacing: -0.4,
  },
  streakNumberUnit: {
    fontFamily: F.displaySemi, fontSize: 14, color: C.inkMuted, letterSpacing: 0,
  },
  streakBarTrack: {
    height: 8,
    backgroundColor: C.surfaceHigh,
    borderRadius: 999,
    marginTop: 8,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  streakBarFill: { height: "100%", backgroundColor: C.yellow, borderRadius: 999 },
  streakSub: {
    fontFamily: F.bodyMedium, fontSize: 12, color: C.inkBody, marginTop: 8,
  },
  usageChip: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.hairline,
    padding: 16,
    gap: 8,
    ...shadow(2),
  },
  usageHeadline: {
    fontFamily: F.displaySemi,
    fontSize: 20,
    color: C.ink,
    letterSpacing: 0,
  },
  usageBlocks: {
    fontFamily: F.bodyBold,
    fontSize: 16,
    color: C.primary,
    letterSpacing: 1,
  },
  usageMeta: {
    fontFamily: F.bodyMedium,
    fontSize: 12,
    color: C.inkBody,
  },

  // Section head
  sectionHead: { marginBottom: 12 },
  sectionTitle: {
    fontFamily: F.displaySemi, fontSize: 22, color: C.ink, letterSpacing: -0.3,
  },

  // Stats
  statRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1, borderColor: C.hairline,
    paddingVertical: 16, paddingHorizontal: 8,
    alignItems: "center",
    ...shadow(1),
  },
  statValue: { fontFamily: F.display, fontSize: 30, letterSpacing: -0.6 },
  statLabel: {
    fontFamily: F.bodyBold, fontSize: 10, color: C.inkMuted,
    letterSpacing: 1.2, marginTop: 4,
  },

  // Trophy
  trophyCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1, borderColor: C.hairline,
    padding: 12, paddingLeft: 16,
    overflow: "hidden",
    ...shadow(1),
  },
  trophyCardPerfect: {
    backgroundColor: C.yellowTint,
    borderColor: "rgba(116,91,0,0.22)",
  },
  trophyLeftRail: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: 5,
    backgroundColor: C.primary,
  },
  trophyEmojiWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: C.surfaceLow,
    alignItems: "center", justifyContent: "center",
  },
  trophyEmojiWrapHigh: { backgroundColor: C.primaryTint },
  trophyEmojiWrapPerfect: {
    backgroundColor: C.yellow,
    borderWidth: 1, borderColor: "rgba(116,91,0,0.32)",
  },
  trophyTitleRow: {
    flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap",
  },
  trophyTitle: {
    fontFamily: F.displaySemi, fontSize: 16, color: C.ink, letterSpacing: -0.2,
    flexShrink: 1,
  },
  perfectPill: {
    backgroundColor: C.yellowDeep,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
  perfectPillText: {
    fontFamily: F.bodyBold, fontSize: 10, color: "#fff", letterSpacing: 1.4,
  },
  trophyMeta: { fontFamily: F.body, fontSize: 12, color: C.inkMuted, marginTop: 4 },
  trophyCorrect: { fontFamily: F.bodySemi, color: C.ink },
  trophyMetaDim: { color: C.inkMuted },

  // Empty
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1, borderColor: C.hairline,
    padding: 28,
    alignItems: "center",
    gap: 12,
    ...shadow(2),
  },
  emptyIconRing: {
    width: 76, height: 76, borderRadius: 999,
    backgroundColor: C.primaryTint,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.primaryBorderTint,
  },
  emptyTitle: {
    fontFamily: F.displaySemi, fontSize: 22, color: C.ink, letterSpacing: -0.3,
    textAlign: "center", marginTop: 4,
  },
  emptyBody: {
    fontFamily: F.body, fontSize: 14, color: C.inkBody,
    textAlign: "center", lineHeight: 20,
  },
});

function shadow(level: 1 | 2 | 3) {
  if (Platform.OS === "android") return { elevation: level * 1.5 };
  const map = {
    1: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, shadowOpacity: 0.04 },
    2: { shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.05 },
    3: { shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, shadowOpacity: 0.07 },
  } as const;
  return { shadowColor: C.primary, ...map[level] } as const;
}
