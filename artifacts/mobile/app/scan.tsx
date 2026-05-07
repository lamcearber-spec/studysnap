import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useSession } from "@/context/SessionContext";
import { useProfile } from "@/context/ProfileContext";
import { maybeRequestReview } from "@/hooks/useAppReview";
import { useColors } from "@/hooks/useColors";
import { getGradeGroupsForCountry, getSubjectsForLanguage } from "@/constants/data";
import { hasFreeScanAvailableToday } from "@/lib/freeScans";
import { useSubscription } from "@/lib/revenuecat";
import type { GenerateExercisesResponse, QuotaExceededError } from "@workspace/api-client-react";
import { fetch } from "expo/fetch";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function IconButton({
  icon,
  label,
  onPress,
  color,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  disabled?: boolean;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.iconButton, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon as any} size={28} color={color} />
        <Text style={[styles.iconButtonLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

function convertImageToBase64(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (Platform.OS === "web") {
      fetch(uri)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    } else {
      import("expo-file-system").then(({ readAsStringAsync }) => {
        readAsStringAsync(uri, { encoding: "base64" })
          .then(resolve)
          .catch(reject);
      });
    }
  });
}

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addSession, sessions, isLoading: sessionsLoading } = useSession();
  const { profile } = useProfile();
  const { isSubscribed, isLoading: subscriptionLoading, appUserId } = useSubscription();
  const enteredWithScanAccess = useRef<boolean | null>(null);

  // Defaults from profile, overrideable per scan
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>(profile?.grade ?? "Grade 5");
  const [isGenerating, setIsGenerating] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const profileSubjects = profile?.subjects ?? [];
  const subjectsList = getSubjectsForLanguage(profile?.language);
  const gradeOptions = useMemo(
    () => getGradeGroupsForCountry(profile?.countryCode).flatMap((group) => group.grades),
    [profile?.countryCode]
  );
  const hasScanAccess = isSubscribed || hasFreeScanAvailableToday(sessions);

  useEffect(() => {
    if (sessionsLoading || subscriptionLoading) return;
    if (enteredWithScanAccess.current === null) {
      enteredWithScanAccess.current = hasScanAccess;
    }
    if (!enteredWithScanAccess.current && !isSubscribed) {
      router.replace("/paywall");
    }
  }, [hasScanAccess, isSubscribed, router, sessionsLoading, subscriptionLoading]);

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Access", "Please allow camera access to take photos of your classwork.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Photo Library", "Please allow photo library access to select your classwork photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleGenerate = async () => {
    if (sessionsLoading || subscriptionLoading) return;
    if (!isSubscribed && !hasFreeScanAvailableToday(sessions)) {
      router.replace("/paywall");
      return;
    }
    if (!appUserId) {
      Alert.alert("Almost ready", "StudySnap is still preparing your account. Please try again in a moment.");
      return;
    }
    if (!imageUri) return;
    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const base64 = await convertImageToBase64(imageUri);

      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const url = domain ? `https://${domain}/api/exercises/generate` : "/api/exercises/generate";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          appUserId,
          subject: selectedSubject ?? undefined,
          grade: selectedGrade,
          language: profile?.language ?? "English",
          difficulty: profile?.difficulty ?? "same",
          countryCode: profile?.countryCode ?? undefined,
        }),
      });

      const data = await response.json() as GenerateExercisesResponse | QuotaExceededError;

      if (response.status === 402 && "error" in data && data.error === "QUOTA_EXCEEDED") {
        const sessionId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        const session = {
          id: sessionId,
          imageUri,
          subject: data.subject,
          topic: data.topic,
          grade: selectedGrade,
          language: profile?.language,
          exercises: data.exercises.map((ex) => ({
            id: ex.id,
            question: ex.question,
            type: ex.type,
            options: ex.options,
            answer: ex.answer,
            imageUrl: undefined,
            userAnswer: undefined,
            isCorrect: undefined,
          })),
          createdAt: new Date().toISOString(),
          totalAnswered: 0,
          totalCorrect: 0,
        };
        await addSession(session);
        router.replace({
          pathname: "/quota-exceeded",
          params: {
            sessionId,
            used: String(data.quota.used),
            limit: String(data.quota.limit),
            resetAt: data.quota.resetAt,
          },
        } as never);
        return;
      }

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const sessionId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

      const session = {
        id: sessionId,
        imageUri,
        subject: data.subject,
        topic: data.topic,
        grade: selectedGrade,
        language: profile?.language,
        exercises: data.exercises.map((ex) => ({
          id: ex.id,
          question: ex.question,
          type: ex.type as "multiple-choice" | "short-answer" | "fill-blank",
          options: ex.options,
          answer: ex.answer,
          imageUrl: ex.imageUrl,
          userAnswer: undefined,
          isCorrect: undefined,
        })),
        createdAt: new Date().toISOString(),
        totalAnswered: 0,
        totalCorrect: 0,
      };

      await addSession(session);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Check if we should prompt for an app store review (after 10 or 20 sessions)
      maybeRequestReview(sessions.length + 1);
      router.replace(`/exercises/${sessionId}`);
    } catch (err) {
      console.error(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Oops!", "Something went wrong generating your exercises. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.navBar, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>New Session</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile context strip */}
        {profile && (
          <View style={[styles.contextStrip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.contextText, { color: colors.mutedForeground }]}>
              🌐 {profile.language}
            </Text>
            <View style={[styles.contextDot, { backgroundColor: colors.border }]} />
            <Text style={[styles.contextText, { color: colors.mutedForeground }]}>
              {profile.difficulty === "easier" ? "😊 Easier" : profile.difficulty === "harder" ? "🔥 Harder" : "⚡ Same level"}
            </Text>
            <View style={[styles.contextDot, { backgroundColor: colors.border }]} />
            <Text style={[styles.contextText, { color: colors.mutedForeground }]}>
              {profile.grade}
            </Text>
          </View>
        )}

        {/* Image area */}
        {!imageUri ? (
          <View style={styles.pickerRow}>
            <IconButton
              icon="camera"
              label="Camera"
              color={colors.primary}
              onPress={pickFromCamera}
            />
            <IconButton
              icon="images"
              label="Gallery"
              color={colors.accent}
              onPress={pickFromGallery}
            />
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
            <Pressable
              style={[styles.retakeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setImageUri(null)}
            >
              <Ionicons name="refresh" size={16} color={colors.foreground} />
              <Text style={[styles.retakeText, { color: colors.foreground }]}>Retake</Text>
            </Pressable>
          </View>
        )}

        {!imageUri && (
          <View style={[styles.hint, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              Take a clear photo of a completed classwork or worksheet page. Make sure the text is readable.
            </Text>
          </View>
        )}

        {imageUri && (
          <>
            {/* Subject selector — profile subjects first */}
            <View>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Subject (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                <View style={styles.chipsRow}>
                  {/* Profile subjects first, then rest */}
                  {[
                    ...subjectsList.filter((s) => profileSubjects.includes(s.id)),
                    ...subjectsList.filter((s) => !profileSubjects.includes(s.id)),
                  ].map((s) => (
                    <Pressable
                      key={s.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selectedSubject === s.id ? colors.primary : colors.muted,
                          borderColor: selectedSubject === s.id ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setSelectedSubject(selectedSubject === s.id ? null : s.id);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={styles.chipEmoji}>{s.emoji}</Text>
                      <Text style={[styles.chipText, { color: selectedSubject === s.id ? "#fff" : colors.foreground }]}>
                        {s.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Grade override */}
            <View>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Grade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                <View style={styles.chipsRow}>
                  {gradeOptions.map((g) => (
                    <Pressable
                      key={g}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selectedGrade === g ? colors.accent : colors.muted,
                          borderColor: selectedGrade === g ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setSelectedGrade(g);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={[styles.chipText, { color: selectedGrade === g ? "#fff" : colors.foreground }]}>
                        {g}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Generate button */}
            <Pressable
              onPress={handleGenerate}
              disabled={isGenerating || sessionsLoading || subscriptionLoading}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={isGenerating ? ["#9CA3AF", "#6B7280"] : [colors.primary, "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generateButton}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.generateButtonText}>Generating exercises...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#fff" />
                    <Text style={styles.generateButtonText}>Generate Exercises</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </>
        )}
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
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  contextStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  contextText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  contextDot: { width: 4, height: 4, borderRadius: 2 },
  pickerRow: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
  },
  iconButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    borderRadius: 20,
    gap: 8,
    minWidth: 130,
  },
  iconButtonLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  hintText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    flex: 1,
  },
  imageContainer: {
    alignItems: "center",
    gap: 12,
  },
  previewImage: {
    width: "100%",
    height: 280,
    borderRadius: 16,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  retakeText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  chipsScroll: { marginHorizontal: -20 },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipEmoji: { fontSize: 14 },
  chipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 18,
  },
  generateButtonText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
