import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { C, F } from "@/app/_components/tokens";
import { Exercise, ExerciseStatus, UserAnswer, useSession } from "@/context/SessionContext";
import { useProfile } from "@/context/ProfileContext";
import { VisualRenderer } from "@/components/math-visuals/VisualRenderer";
import { AnswerInput } from "@/components/AnswerInput";
import { gradeAnswer, supportsAutoGrade } from "@/lib/grade";

type ExerciseCardProps = {
  exercise: Exercise;
  sessionId: string;
  index: number;
  total: number;
};

type GradeKind = "correct" | "wrong";
type IconName = React.ComponentProps<typeof Ionicons>["name"];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const isWeb = Platform.OS === "web";

function normalize(value?: string) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function nextStatus(current: ExerciseStatus, target: GradeKind): ExerciseStatus {
  return current === target ? "pending" : target;
}

function notifyStatus(status: ExerciseStatus) {
  if (isWeb || status === "pending") return;
  const feedback = status === "correct"
    ? Haptics.NotificationFeedbackType.Success
    : Haptics.NotificationFeedbackType.Warning;
  Haptics.notificationAsync(feedback);
}

function GradeButton({
  kind,
  active,
  onPress,
}: {
  kind: GradeKind;
  active: boolean;
  onPress: () => void;
}) {
  const press = useSharedValue(0);
  const scale = useSharedValue(1);
  const isPositive = kind === "correct";
  const color = isPositive ? C.primary : C.error;
  const icon: IconName = isPositive ? "checkmark" : "close";
  const label = isPositive ? "Correct" : "Wrong";

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(press.value, [0, 1], [0, 2]) }],
  }));
  const ledgeStyle = useAnimatedStyle(() => ({
    height: interpolate(press.value, [0, 1], [4, 2]),
  }));

  return (
    <AnimatedPressable
      style={[styles.gradeWrap, wrapStyle]}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 70 });
        scale.value = withSpring(0.97, { stiffness: 320, damping: 20 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { stiffness: 320, damping: 20 });
        scale.value = withSpring(1, { stiffness: 320, damping: 20 });
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.gradeLedge,
          { backgroundColor: active ? (isPositive ? C.primaryShadow : "#7A1111") : C.hairline },
          ledgeStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.gradeFace,
          {
            backgroundColor: active ? color : C.card,
            borderColor: color,
          },
          faceStyle,
        ]}
      >
        <Ionicons name={icon} size={20} color={active ? "#fff" : color} />
        <Text style={[styles.gradeText, { color: active ? "#fff" : color }]}>{label}</Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

function AnswerReveal({ exercise }: { exercise: Exercise }) {
  const hasOptions = exercise.type === "multiple-choice" && exercise.options?.length;
  const answer = exercise.answer ?? "No answer provided";

  return (
    <View style={styles.answerCard}>
      <Text style={styles.answerLabel}>ANSWER</Text>
      {hasOptions ? (
        <View style={styles.answerOptions}>
          {exercise.options?.map((option) => {
            const isAnswer = normalize(option) === normalize(exercise.answer);
            return (
              <View
                key={option}
                style={[
                  styles.answerOption,
                  isAnswer ? styles.answerOptionCorrect : styles.answerOptionDim,
                ]}
              >
                <View style={styles.answerIconSlot}>
                  {isAnswer && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                </View>
                <Text style={[styles.answerOptionText, !isAnswer && styles.answerOptionTextDim]}>
                  {option}
                </Text>
              </View>
            );
          })}
          {!exercise.options?.some((option) => normalize(option) === normalize(exercise.answer)) && (
            <Text style={styles.answerText}>{answer}</Text>
          )}
        </View>
      ) : (
        <Text style={styles.answerText}>{answer}</Text>
      )}
    </View>
  );
}

export function ExerciseCard({ exercise, sessionId, index, total }: ExerciseCardProps) {
  const { setExerciseStatus, setExerciseAnswer } = useSession();
  const { profile } = useProfile();
  const autoGrade = profile?.autoGrade ?? false;
  const [showAnswer, setShowAnswer] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const status = exercise.status ?? "pending";
  const cardOpacity = useSharedValue(0);
  const canAutoGrade = autoGrade && supportsAutoGrade(exercise);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 260 + index * 35 });
  }, [cardOpacity, index]);

  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value }));

  const setStatus = async (target: GradeKind) => {
    const updated = nextStatus(status, target);
    notifyStatus(updated);
    await setExerciseStatus(sessionId, exercise.id, updated);
  };

  const handleAnswerChange = async (answer: UserAnswer | undefined) => {
    await setExerciseAnswer(sessionId, exercise.id, answer);
  };

  const handleSubmit = async () => {
    const result = gradeAnswer(exercise);
    notifyStatus(result);
    await setExerciseStatus(sessionId, exercise.id, result);
    setShowAnswer(true);
  };

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <View style={styles.topRow}>
        <Text style={styles.kicker}>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</Text>
        <View style={[styles.statusDot, status !== "pending" && {
          backgroundColor: status === "correct" ? C.primary : C.error,
        }]} />
      </View>

      <Text style={styles.question}>{exercise.question}</Text>

      {exercise.visual && (
        <View style={styles.visualWrap}>
          <VisualRenderer visual={exercise.visual} />
        </View>
      )}

      {exercise.imageUrl && !exercise.visual && (
        <View style={styles.visualWrap}>
          <Image
            source={{ uri: exercise.imageUrl }}
            style={styles.visualImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            onLoadEnd={() => setImageLoaded(true)}
          />
          {!imageLoaded && <View style={styles.visualSkeleton} />}
        </View>
      )}

      {exercise.cardType && (
        <View style={styles.inputWrap}>
          <AnswerInput
            exercise={exercise}
            onChange={handleAnswerChange}
            onSubmit={canAutoGrade ? handleSubmit : undefined}
            disabled={status !== "pending"}
          />
        </View>
      )}

      {!showAnswer ? (
        <Pressable
          onPress={() => {
            setShowAnswer(true);
            if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.showAnswerButton}
          accessibilityRole="button"
        >
          <Ionicons name="eye-outline" size={16} color={C.primary} />
          <Text style={styles.showAnswerText}>Show answer</Text>
        </Pressable>
      ) : (
        <AnswerReveal exercise={exercise} />
      )}

      {!canAutoGrade && (
        <View style={styles.gradeRow}>
          <GradeButton
            kind="correct"
            active={status === "correct"}
            onPress={() => { setStatus("correct"); }}
          />
          <GradeButton
            kind="wrong"
            active={status === "wrong"}
            onPress={() => { setStatus("wrong"); }}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.hairline,
    padding: 16,
    gap: 14,
    boxShadow: "0 2px 0 rgba(27, 28, 28, 0.08)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    fontFamily: F.bodyBold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.4,
    color: C.inkMuted,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: C.surfaceHigh,
  },
  question: {
    fontFamily: F.displaySemi,
    fontSize: 18,
    lineHeight: 25,
    color: C.ink,
    letterSpacing: 0,
  },
  visualWrap: {
    minHeight: 168,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.surfaceLow,
    overflow: "hidden",
  },
  visualImage: {
    width: "100%",
    minHeight: 168,
  },
  visualSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.surfaceLow,
    opacity: 0.82,
  },
  inputWrap: {
    gap: 8,
  },
  showAnswerButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primaryTint,
    borderColor: C.primaryBorderTint,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  showAnswerText: {
    fontFamily: F.bodySemi,
    fontSize: 13,
    color: C.primary,
  },
  answerCard: {
    backgroundColor: C.primaryTint,
    borderColor: C.primaryBorderTint,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  answerLabel: {
    fontFamily: F.bodyBold,
    fontSize: 10,
    color: C.inkMuted,
    letterSpacing: 1.2,
  },
  answerText: {
    fontFamily: F.displaySemi,
    fontSize: 16,
    lineHeight: 22,
    color: C.primaryDark,
  },
  answerOptions: {
    gap: 8,
  },
  answerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  answerOptionCorrect: {
    backgroundColor: C.card,
    borderColor: C.primaryBorderTint,
  },
  answerOptionDim: {
    backgroundColor: "rgba(255,255,255,0.52)",
    borderColor: "rgba(194,201,187,0.58)",
  },
  answerIconSlot: {
    width: 18,
    alignItems: "center",
  },
  answerOptionText: {
    flex: 1,
    fontFamily: F.bodySemi,
    fontSize: 14,
    color: C.primaryDark,
  },
  answerOptionTextDim: {
    color: C.inkMuted,
    fontFamily: F.bodyMedium,
  },
  gradeRow: {
    flexDirection: "row",
    gap: 12,
  },
  gradeWrap: {
    flex: 1,
    minHeight: 56,
    position: "relative",
  },
  gradeLedge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  gradeFace: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    paddingVertical: 14,
  },
  gradeText: {
    fontFamily: F.displaySemi,
    fontSize: 15,
    letterSpacing: 0,
  },
});
