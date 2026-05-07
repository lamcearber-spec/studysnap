import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Exercise } from "@/context/SessionContext";
import { useColors } from "@/hooks/useColors";

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onAnswer: (exerciseId: string, answer: string) => void;
  revealed: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function OptionButton({
  option,
  isSelected,
  isCorrect,
  isWrong,
  revealed,
  onPress,
}: {
  option: string;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  revealed: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  let bg = colors.muted;
  let border = colors.border;
  let textColor = colors.foreground;

  if (isSelected && isCorrect) {
    bg = colors.success + "20";
    border = colors.success;
    textColor = colors.success;
  } else if (isSelected && isWrong) {
    bg = colors.destructive + "20";
    border = colors.destructive;
    textColor = colors.destructive;
  } else if (revealed && isCorrect) {
    bg = colors.success + "15";
    border = colors.success;
    textColor = colors.success;
  } else if (isSelected) {
    bg = colors.primary + "15";
    border = colors.primary;
    textColor = colors.primary;
  }

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
      disabled={revealed}
    >
      <View style={[styles.option, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
        {revealed && isCorrect && (
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        )}
        {isSelected && isWrong && (
          <Ionicons name="close-circle" size={18} color={colors.destructive} />
        )}
      </View>
    </AnimatedPressable>
  );
}

export function ExerciseCard({ exercise, index, onAnswer, revealed }: ExerciseCardProps) {
  const colors = useColors();
  const [shortAnswer, setShortAnswer] = useState(exercise.userAnswer ?? "");
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardOpacity = useSharedValue(0);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 300 + index * 80 }),
  }));

  const handleOptionSelect = (option: string) => {
    if (revealed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAnswer(exercise.id, option);
  };

  const isMultipleChoice = exercise.type === "multiple-choice";
  const isShortAnswer = exercise.type === "short-answer" || exercise.type === "fill-blank";

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, animatedCardStyle]}>
      <View style={styles.header}>
        <View style={[styles.indexBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.indexText, { color: colors.primary }]}>{index + 1}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.typeText, { color: colors.mutedForeground }]}>
            {exercise.type === "multiple-choice" ? "Multiple Choice" : exercise.type === "fill-blank" ? "Fill in Blank" : "Short Answer"}
          </Text>
        </View>
      </View>

      {exercise.imageUrl && (
        <View style={[styles.visualWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Image
            source={{ uri: exercise.imageUrl }}
            style={styles.visualImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            onLoadEnd={() => setImageLoaded(true)}
          />
          {!imageLoaded && <View style={[styles.visualSkeleton, { backgroundColor: colors.muted }]} />}
        </View>
      )}

      <Text style={[styles.question, { color: colors.foreground }]}>{exercise.question}</Text>

      {isMultipleChoice && exercise.options && (
        <View style={styles.options}>
          {exercise.options.map((opt, i) => {
            const isSelected = exercise.userAnswer === opt;
            const isCorrect = exercise.answer === opt;
            const isWrong = isSelected && !isCorrect;
            return (
              <OptionButton
                key={i}
                option={opt}
                isSelected={isSelected}
                isCorrect={isCorrect}
                isWrong={isWrong}
                revealed={revealed}
                onPress={() => handleOptionSelect(opt)}
              />
            );
          })}
        </View>
      )}

      {isShortAnswer && revealed && exercise.answer && (
        <View style={[styles.answerBox, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[styles.answerText, { color: colors.success }]}>{exercise.answer}</Text>
        </View>
      )}

      {revealed && exercise.type === "multiple-choice" && exercise.userAnswer && exercise.answer !== exercise.userAnswer && (
        <View style={[styles.answerHint, { backgroundColor: colors.success + "15" }]}>
          <Text style={[styles.answerHintLabel, { color: colors.mutedForeground }]}>Correct answer:</Text>
          <Text style={[styles.answerHintText, { color: colors.success }]}>{exercise.answer}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  question: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
  },
  visualWrap: {
    minHeight: 160,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  visualImage: {
    width: "100%",
    minHeight: 160,
  },
  visualSkeleton: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
  },
  options: {
    gap: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  answerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  answerText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  answerHint: {
    padding: 10,
    borderRadius: 8,
    gap: 2,
  },
  answerHintLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  answerHintText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
