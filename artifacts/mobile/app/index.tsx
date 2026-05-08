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
import { type Session, useSession } from "@/context/SessionContext";
import { GraduationCap, Flame } from "phosphor-react-native";
import { DifficultyIcon } from "@/components/DifficultyIcon";
import { Mascot } from "@/components/Mascot";
import { SubjectIcon } from "@/components/SubjectIcon";
import { getDifficultiesForLanguage, getSubjectLabel } from "@/constants/data";
import { hasFreeScanAvailableToday } from "@/lib/freeScans";
import { useSubscription } from "@/lib/revenuecat";
import { useGetUsage, type Quota } from "@workspace/api-client-react";
import { C, F } from "@/app/_components/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const isWeb = Platform.OS === "web";

// ── Localisation ────────────────────────────────────────────────────────────
// All visible strings on the home screen are derived from this one object so
// switching country → German or French propagates everywhere at once.
type HomeStrings = {
  greetMorning: (name: string) => string;
  greetAfternoon: (name: string) => string;
  greetEvening: (name: string) => string;
  heroHeadline: string;
  scanTitle: string;
  scanSub: string;
  scanA11y: string;
  dailyHabit: string;
  daysInARow: (n: number) => string;
  exercisesToday: (done: number, total: number, done100: boolean) => string;
  imagesThisMonth: (used: number, limit: number, resetLabel: string) => string;
  statSessions: string;
  statExercises: string;
  statAccuracy: string;
  progressKicker: string;
  progressTitle: string;
  recentKicker: string;
  recentTitle: string;
  emptyTitle: string;
  emptyBody: string;
  awaitingReview: (pending: number, total: number) => string;
  correctOf: (correct: number, answered: number) => string;
  perfect: string;
  openSettings: string;
};

function getHomeStrings(language?: string): HomeStrings {
  if (language === "German") {
    return {
      greetMorning: (n) => `Guten Morgen, ${n}`,
      greetAfternoon: (n) => `Guten Tag, ${n}`,
      greetEvening: (n) => `Guten Abend, ${n}`,
      heroHeadline: "Foto. Üben.\nMeistern.",
      scanTitle: "Hausaufgaben scannen",
      scanSub: "Foto machen · wir erstellen passende Übungen.",
      scanA11y: "Hausaufgaben scannen",
      dailyHabit: "TAGESGEWOHNHEIT",
      daysInARow: (n) => `${n} ${n === 1 ? "Tag" : "Tage"} in Folge`,
      exercisesToday: (done, total, d100) =>
        `${done}/${total} Übungen heute${d100 ? " · geschafft!" : ""}`,
      imagesThisMonth: (used, limit, reset) =>
        `${used} / ${limit} Bilder diesen Monat · Reset ${reset}`,
      statSessions: "SITZUNGEN",
      statExercises: "ÜBUNGEN",
      statAccuracy: "GENAUIGKEIT",
      progressKicker: "DEIN FORTSCHRITT",
      progressTitle: "Das Regal bisher",
      recentKicker: "ZULETZT",
      recentTitle: "Trophäenregal",
      emptyTitle: "Deine erste Sitzung ist einen Tipp entfernt.",
      emptyBody:
        "Foto einer Seite aus deinem Heft oder Schulbuch. Wir erstellen ein passendes Arbeitsblatt, das du in fünf Minuten erledigen kannst.",
      awaitingReview: (p, t) => `Warten auf Überprüfung · ${p} von ${t}`,
      correctOf: (c, a) => `${c}/${a} richtig`,
      perfect: "PERFEKT",
      openSettings: "Einstellungen öffnen",
    };
  }
  if (language === "French") {
    return {
      greetMorning: (n) => `Bonjour, ${n}`,
      greetAfternoon: (n) => `Bon après-midi, ${n}`,
      greetEvening: (n) => `Bonsoir, ${n}`,
      heroHeadline: "Photo. Pratique.\nMaîtrise.",
      scanTitle: "Scanner le devoir",
      scanSub: "Prends une photo · on crée des exercices assortis.",
      scanA11y: "Scanner le devoir",
      dailyHabit: "HABITUDE DU JOUR",
      daysInARow: (n) => `${n} ${n === 1 ? "jour" : "jours"} d'affilée`,
      exercisesToday: (done, total, d100) =>
        `${done}/${total} exercices aujourd'hui${d100 ? " · terminé !" : ""}`,
      imagesThisMonth: (used, limit, reset) =>
        `${used} / ${limit} images ce mois · renouvellement ${reset}`,
      statSessions: "SESSIONS",
      statExercises: "EXERCICES",
      statAccuracy: "PRÉCISION",
      progressKicker: "TA PROGRESSION",
      progressTitle: "Le bilan jusqu'ici",
      recentKicker: "RÉCENT",
      recentTitle: "Tableau d'honneur",
      emptyTitle: "Ta première session est à un tap.",
      emptyBody:
        "Prends en photo une page de ton cahier ou manuel. On prépare une fiche d'exercices que tu peux faire en cinq minutes.",
      awaitingReview: (p, t) => `En attente · ${p} sur ${t}`,
      correctOf: (c, a) => `${c}/${a} juste`,
      perfect: "PARFAIT",
      openSettings: "Ouvrir les paramètres",
    };
  }
  // English (default)
  return {
    greetMorning: (n) => `Good morning, ${n}`,
    greetAfternoon: (n) => `Good afternoon, ${n}`,
    greetEvening: (n) => `Good evening, ${n}`,
    heroHeadline: "Snap. Practice.\nMaster.",
    scanTitle: "Scan classwork",
    scanSub: "Snap a page · we'll make matching practice.",
    scanA11y: "Scan classwork",
    dailyHabit: "DAILY HABIT",
    daysInARow: (n) => `${n} day${n === 1 ? "" : "s"} in a row`,
    exercisesToday: (done, total, d100) =>
      `${done}/${total} exercises today${d100 ? " · done!" : ""}`,
    imagesThisMonth: (used, limit, reset) =>
      `${used} / ${limit} images this month · resets ${reset}`,
    statSessions: "SESSIONS",
    statExercises: "EXERCISES",
    statAccuracy: "ACCURACY",
    progressKicker: "YOUR PROGRESS",
    progressTitle: "The shelf so far",
    recentKicker: "RECENT",
    recentTitle: "Trophy shelf",
    emptyTitle: "Your first session is one tap away.",
    emptyBody:
      "Snap a page from your notebook or textbook. We'll make a parallel worksheet you can do in five minutes.",
    awaitingReview: (p, t) => `Awaiting review · ${p} of ${t}`,
    correctOf: (c, a) => `${c}/${a} correct`,
    perfect: "PERFECT",
    openSettings: "Open settings",
  };
}

function getGreeting(name: string | undefined, s: HomeStrings): string {
  const hour = new Date().getHours();
  const first = name?.split(" ")[0] ?? "friend";
  if (hour < 12) return s.greetMorning(first);
  if (hour < 17) return s.greetAfternoon(first);
  return s.greetEvening(first);
}

// ── Tactile scan CTA ─────────────────────────────────────────────────────────
function ScanCTA({ s }: { s: HomeStrings }) {
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
        accessibilityLabel={s.scanA11y}
      >
        <View style={styles.ctaIconWrap}>
          <Ionicons name="camera" size={30} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>{s.scanTitle}</Text>
          <Text style={styles.ctaSub}>{s.scanSub}</Text>
        </View>
        <Ionicons name="arrow-forward" size={22} color="rgba(255,255,255,0.85)" />
      </AnimatedPressable>
    </View>
  );
}

function StreakCard({
  streak, doneToday, totalToday, s,
}: {
  streak: number; doneToday: number; totalToday: number; s: HomeStrings;
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
        <Text style={styles.kicker}>{s.dailyHabit}</Text>
      </View>
      <View style={styles.streakCard}>
        <View style={styles.streakFlame}>
          <Flame size={26} color={C.yellowDeep} weight="duotone" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakNumber}>
            {s.daysInARow(streak)}
          </Text>
          <View style={styles.streakBarTrack}>
            <View style={[styles.streakBarFill, fillStyle]} />
          </View>
          <Text style={styles.streakSub}>
            {s.exercisesToday(doneToday, totalToday, pct === 1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function UsageChip({ quota, streak, s }: { quota: Quota; streak: number; s: HomeStrings }) {
  const usedPct = quota.limit <= 0 ? 0 : Math.min(1, quota.used / quota.limit);
  const filledBlocks = Math.round(usedPct * 10);
  const usageBlocks = Array.from({ length: 10 }, (_, i) => i < filledBlocks ? "█" : "░").join("");
  const resetLabel = new Date(quota.resetAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <View>
      <View style={styles.kickerRow}>
        <View style={styles.kickerPip} />
        <Text style={styles.kicker}>{s.dailyHabit}</Text>
      </View>
      <View style={styles.usageChip}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Flame size={16} color={C.yellowDeep} weight="duotone" />
          <Text style={styles.usageHeadline}>{s.daysInARow(streak)}</Text>
        </View>
        <Text style={styles.usageBlocks}>{usageBlocks}</Text>
        <Text style={styles.usageMeta}>
          {s.imagesThisMonth(quota.used, quota.limit, resetLabel)}
        </Text>
      </View>
    </View>
  );
}

function StatTrio({ sessions, exercises, accuracy, s }: {
  sessions: number; exercises: number; accuracy: number | null; s: HomeStrings;
}) {
  return (
    <View style={styles.statRow}>
      <StatCard label={s.statSessions} value={String(sessions)} valueColor={C.primary} />
      <StatCard label={s.statExercises} value={String(exercises)} valueColor={C.yellowDeep} />
      <StatCard label={s.statAccuracy} value={accuracy === null ? "—" : `${accuracy}%`} valueColor={C.primaryDark} />
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

function getReviewCounts(session: Session) {
  const total = session.exercises.length;
  const hasStatuses = session.exercises.some((e) => e.status !== undefined);

  if (!hasStatuses) {
    const answered = Math.min(total, Math.max(0, session.totalAnswered));
    const correct = Math.min(answered, Math.max(0, session.totalCorrect));
    return { total, answered, correct, wrong: Math.max(0, answered - correct), pending: Math.max(0, total - answered) };
  }

  const correct = session.exercises.filter((e) => e.status === "correct").length;
  const wrong = session.exercises.filter((e) => e.status === "wrong").length;
  const answered = correct + wrong;
  return { total, answered, correct, wrong, pending: Math.max(0, total - answered) };
}

function TrophyRow({
  subjectId, title, correct, answered, pending, total, dateLabel, onPress, s,
}: {
  subjectId: string; title: string; correct: number; answered: number; pending: number; total: number;
  dateLabel: string; onPress: () => void; s: HomeStrings;
}) {
  const pct = answered === 0 ? 0 : Math.round((correct / answered) * 100);
  const tier =
    answered === 0 ? "pending"
    : pct === 100 ? "perfect"
    : pct >= 80 ? "high"
    : "regular";
  const isPending = tier === "pending";
  const isPerfect = tier === "perfect";
  const isHigh = tier === "high";
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const cardStyle = [
    styles.trophyCard,
    isPending && styles.trophyCardPending,
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
      accessibilityLabel={
        isPending
          ? `${title}, ${s.awaitingReview(pending, total)}, ${dateLabel}`
          : `${title}, ${s.correctOf(correct, answered)}, ${pct}%, ${dateLabel}`
      }
    >
      {isHigh && <View style={styles.trophyLeftRail} />}
      <View style={emojiWrapStyle}>
        <SubjectIcon
          id={subjectId}
          size={22}
          color={isPerfect ? C.yellowDeep : isHigh ? C.primary : C.ink}
          weight={isPerfect ? "duotone" : "regular"}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.trophyTitleRow}>
          <Text style={styles.trophyTitle} numberOfLines={1}>{title}</Text>
          {isPerfect && (
            <View style={styles.perfectPill}>
              <Text style={styles.perfectPillText}>{s.perfect}</Text>
            </View>
          )}
        </View>
        <Text style={styles.trophyMeta}>
          {isPending ? (
            <Text style={styles.trophyAwaiting}>{s.awaitingReview(pending, total)}</Text>
          ) : (
            <>
              <Text style={[
                styles.trophyCorrect,
                isPerfect && { color: C.yellowDeep },
                isHigh && { color: C.primary },
              ]}>
                {s.correctOf(correct, answered)}
              </Text>
              <Text style={styles.trophyMetaDim}>{"  ·  "}{pct}%</Text>
            </>
          )}
          <Text style={styles.trophyMetaDim}>{"  ·  "}{dateLabel}</Text>
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.inkMuted} />
    </AnimatedPressable>
  );
}

function EmptyState({ s }: { s: HomeStrings }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconRing}>
        <Ionicons name="book-outline" size={42} color={C.primary} />
      </View>
      <Text style={styles.emptyTitle}>{s.emptyTitle}</Text>
      <Text style={styles.emptyBody}>{s.emptyBody}</Text>
    </View>
  );
}

function SubjectChip({ id, language }: { id: string; language?: string }) {
  return (
    <View style={styles.chip}>
      <SubjectIcon id={id} size={12} color={C.primaryDark} weight="regular" />
      <Text style={styles.chipLabel}>{getSubjectLabel(id, language)}</Text>
    </View>
  );
}

function ProfileStrip({
  grade, difficultyId, difficultyLabel, subjects, language,
}: {
  grade: string; difficultyId: string; difficultyLabel: string; subjects: string[]; language?: string;
}) {
  return (
    <View style={styles.profileStrip}>
      <View style={styles.profileMetaItem}>
        <GraduationCap size={16} color={C.ink} weight="regular" />
        <Text style={styles.profileMetaText}>{grade}</Text>
      </View>
      <View style={styles.stripDivider} />
      <View style={styles.profileMetaItem}>
        <DifficultyIcon id={difficultyId} size={16} color={C.ink} weight="regular" />
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

function SettingsButton({ label }: { label: string }) {
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
      accessibilityLabel={label}
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

  const s = getHomeStrings(profile?.language);
  const greeting = getGreeting(profile?.name, s);
  const difficulties = getDifficultiesForLanguage(profile?.language);
  const difficultyInfo = difficulties.find((d) => d.id === profile?.difficulty);
  const totalExercises = sessions.reduce((sum, s) => sum + s.exercises.length, 0);
  const reviewedTotals = sessions.reduce(
    (acc, session) => {
      const counts = getReviewCounts(session);
      return { correct: acc.correct + counts.correct, answered: acc.answered + counts.answered };
    },
    { correct: 0, answered: 0 },
  );
  const accuracy = reviewedTotals.answered > 0
    ? Math.round((reviewedTotals.correct / reviewedTotals.answered) * 100)
    : null;

  const streak = computeStreak(sessions.map((session) => session.createdAt));
  const todaysExercises = sessions
    .filter((session) => isSameDay(new Date(session.createdAt), new Date()))
    .reduce((sum, session) => sum + session.exercises.length, 0);

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
        <View style={styles.hudStrip}>
          <View style={styles.hudPill}>
            <Flame size={18} color={C.yellow} weight="duotone" />
            <Text style={styles.hudPillNumber}>{streak}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <SettingsButton label={s.openSettings} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroMascot}>
            <Mascot variant="pose" size={120} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroGreeting}>{greeting.toLowerCase()}</Text>
            <Text style={styles.heroHeadline}>{s.heroHeadline}</Text>
          </View>
        </View>

        {profile && (
          <ProfileStrip
            grade={profile.grade ?? "Grade —"}
            difficultyId={difficultyInfo?.id ?? "same"}
            difficultyLabel={difficultyInfo?.label ?? "Same level"}
            subjects={profile.subjects ?? []}
            language={profile.language}
          />
        )}

        {isSubscribed && usageQuery.data && (
          <UsageChip quota={usageQuery.data} streak={streak} s={s} />
        )}

        <ScanCTA s={s} />

        {sessions.length > 0 && !usageQuery.data && (
          <StreakCard
            streak={streak}
            doneToday={todaysExercises}
            totalToday={Math.max(8, todaysExercises)}
            s={s}
          />
        )}

        {sessions.length > 0 && (
          <View>
            <SectionHead kicker={s.progressKicker} title={s.progressTitle} />
            <StatTrio sessions={sessions.length} exercises={totalExercises} accuracy={accuracy} s={s} />
          </View>
        )}

        {sessions.length > 0 && (
          <View>
            <SectionHead kicker={s.recentKicker} title={s.recentTitle} />
            <View style={{ gap: 12 }}>
              {sessions.slice(0, 5).map((session) => {
                const counts = getReviewCounts(session);
                return (
                  <TrophyRow
                    key={session.id}
                    subjectId={session.subject}
                    title={session.topic || getSubjectLabel(session.subject, profile?.language)}
                    correct={counts.correct}
                    answered={counts.answered}
                    pending={counts.pending}
                    total={counts.total}
                    dateLabel={relativeDate(new Date(session.createdAt))}
                    onPress={() => router.push(`/exercises/${session.id}`)}
                    s={s}
                  />
                );
              })}
            </View>
          </View>
        )}

        {!isLoading && sessions.length === 0 && <EmptyState s={s} />}
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
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 20 },

  hudStrip: { flexDirection: "row", alignItems: "center", gap: 8 },
  hudPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.yellowTint,
    borderWidth: 1, borderColor: "rgba(166,108,0,0.18)",
  },
  hudPillNumber: { fontFamily: F.display, fontSize: 16, color: C.yellowDeep },

  hero: {
    backgroundColor: C.primary, borderRadius: 20,
    paddingVertical: 22, paddingHorizontal: 22,
    flexDirection: "row", alignItems: "center", gap: 14, overflow: "hidden",
  },
  heroMascot: {
    width: 124, height: 124, backgroundColor: "#FFFFFF",
    borderRadius: 999, alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  heroText: { flex: 1 },
  heroGreeting: {
    fontFamily: F.bodyMedium, fontSize: 13,
    color: "rgba(255,255,255,0.78)", marginBottom: 4, textTransform: "capitalize",
  },
  heroHeadline: {
    fontFamily: F.display, fontSize: 26, color: "#FFFFFF",
    lineHeight: 30, letterSpacing: -0.6,
  },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  greeting: { fontFamily: F.display, fontSize: 22, color: C.ink, letterSpacing: -0.4 },
  settingsButton: {
    width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: C.surfaceLow, borderWidth: 1, borderColor: C.hairline,
  },

  profileStrip: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.surfaceLow, borderRadius: 12, paddingHorizontal: 12,
    paddingVertical: 10, borderWidth: 1, borderColor: C.hairline,
  },
  profileMetaItem: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  profileMetaText: { fontFamily: F.body, fontSize: 13, color: C.ink },
  stripDivider: { width: 1, height: 14, backgroundColor: C.hairline },
  subjectsRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4,
    borderWidth: 1, borderColor: C.hairline,
  },
  chipOverflow: { backgroundColor: "transparent" },
  chipLabel: { fontFamily: F.body, fontSize: 11, color: C.primaryDark },

  kickerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  kickerPip: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary },
  kicker: { fontFamily: F.bodyMedium, fontSize: 10, color: C.primaryDark, letterSpacing: 1.2 },

  streakCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.surfaceLow, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.hairline,
  },
  streakFlame: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.yellowTint, alignItems: "center", justifyContent: "center" },
  streakNumber: { fontFamily: F.display, fontSize: 22, color: C.ink, letterSpacing: -0.4 },
  streakNumberUnit: { fontFamily: F.body, fontSize: 14, color: C.inkMuted },
  streakBarTrack: { height: 4, backgroundColor: C.hairline, borderRadius: 2, marginVertical: 6, overflow: "hidden" },
  streakBarFill: { height: "100%", backgroundColor: C.yellowDeep, borderRadius: 2 },
  streakSub: { fontFamily: F.body, fontSize: 12, color: C.inkMuted },

  usageChip: {
    backgroundColor: C.surfaceLow, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.hairline, gap: 6,
  },
  usageHeadline: { fontFamily: F.display, fontSize: 16, color: C.ink },
  usageBlocks: { fontFamily: "Courier", fontSize: 13, color: C.primary, letterSpacing: 2 },
  usageMeta: { fontFamily: F.body, fontSize: 11, color: C.inkMuted },

  ctaWrap: { position: "relative" },
  ctaLedge: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.primaryDark, borderRadius: 16,
  },
  ctaFace: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.primaryDark, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 16, marginBottom: 4,
  },
  ctaIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center",
  },
  ctaTitle: { fontFamily: F.display, fontSize: 18, color: "#FFFFFF", letterSpacing: -0.3 },
  ctaSub: { fontFamily: F.body, fontSize: 13, color: "rgba(255,255,255,0.72)", marginTop: 2 },

  statRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: C.surfaceLow, borderRadius: 12, padding: 12,
    alignItems: "center", borderWidth: 1, borderColor: C.hairline,
  },
  statValue: { fontFamily: F.display, fontSize: 24, letterSpacing: -0.5 },
  statLabel: { fontFamily: F.bodyMedium, fontSize: 9, color: C.inkMuted, letterSpacing: 1.1, marginTop: 2 },

  sectionHead: { gap: 2 },
  sectionTitle: { fontFamily: F.display, fontSize: 20, color: C.ink, letterSpacing: -0.4 },

  trophyCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.surfaceLow, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.hairline, overflow: "hidden",
  },
  trophyCardPending: { opacity: 0.7 },
  trophyCardPerfect: { backgroundColor: C.yellowTint, borderColor: C.yellowDeep },
  trophyLeftRail: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, backgroundColor: C.primary },
  trophyEmojiWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.hairline, alignItems: "center", justifyContent: "center",
  },
  trophyEmojiWrapPerfect: { backgroundColor: C.yellow },
  trophyEmojiWrapHigh: { backgroundColor: C.primaryTint },
  trophyTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  trophyTitle: { fontFamily: F.bodyMedium, fontSize: 14, color: C.ink, flex: 1 },
  perfectPill: { backgroundColor: C.yellowDeep, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  perfectPillText: { fontFamily: F.bodyMedium, fontSize: 9, color: "#FFFFFF", letterSpacing: 0.6 },
  trophyMeta: { fontFamily: F.body, fontSize: 12, color: C.inkMuted, marginTop: 2 },
  trophyAwaiting: { color: C.inkMuted },
  trophyCorrect: { color: C.inkMuted },
  trophyMetaDim: { color: C.inkMuted },

  emptyCard: {
    backgroundColor: C.surfaceLow, borderRadius: 16, padding: 28,
    alignItems: "center", gap: 12, borderWidth: 1, borderColor: C.hairline,
  },
  emptyIconRing: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryTint,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontFamily: F.display, fontSize: 18, color: C.ink, textAlign: "center", letterSpacing: -0.3 },
  emptyBody: { fontFamily: F.body, fontSize: 14, color: C.inkMuted, textAlign: "center", lineHeight: 20 },
});
