import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SessionCard } from "@/components/SessionCard";
import { useSession } from "@/context/SessionContext";
import { useColors } from "@/hooks/useColors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ScanButton() {
  const colors = useColors();
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/scan");
  };

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={handlePress}
    >
      <LinearGradient
        colors={[colors.primary, "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.scanButton}
      >
        <Ionicons name="camera" size={32} color="#fff" />
        <View>
          <Text style={styles.scanButtonTitle}>Scan Classwork</Text>
          <Text style={styles.scanButtonSub}>Take a photo to generate exercises</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, isLoading } = useSession();
  const isWeb = Platform.OS === "web";

  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Ready to practice?</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>StudySnap</Text>
          </View>
          <View style={[styles.iconBadge, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="school" size={22} color={colors.primary} />
          </View>
        </View>

        {/* Scan CTA */}
        <ScanButton />

        {/* Stats row */}
        {sessions.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{sessions.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Sessions</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {sessions.reduce((sum, s) => sum + s.exercises.length, 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Exercises</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {sessions.reduce((sum, s) => sum + s.totalCorrect, 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Correct</Text>
            </View>
          </View>
        )}

        {/* Past sessions */}
        {sessions.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Sessions</Text>
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </View>
        )}

        {/* Empty state */}
        {!isLoading && sessions.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="book-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No sessions yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap the button above to scan your first classwork page and get practice exercises
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    gap: 14,
  },
  scanButtonTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  scanButtonSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
