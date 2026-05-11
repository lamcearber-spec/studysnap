import React, { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "@/app/_components/tokens";
import type { Exercise, UserAnswer } from "@/context/SessionContext";
import { NumericKeypad } from "./NumericKeypad";
import { TapToMarkInput } from "./TapToMarkInput";
import { ConnectPairsInput } from "./ConnectPairsInput";
import { DrawingCanvas, type DrawingCanvasHandle, type Stroke } from "./DrawingCanvas";

type AnswerInputProps = {
  exercise: Exercise;
  onChange: (answer: UserAnswer | undefined) => void;
  onSubmit?: () => void;
  disabled?: boolean;
};

function asString(a: UserAnswer | undefined): string {
  return typeof a === "string" ? a : "";
}

function asMarked(a: UserAnswer | undefined): string[] {
  if (a && typeof a === "object" && "marked" in a && Array.isArray((a as { marked: string[] }).marked)) {
    return (a as { marked: string[] }).marked;
  }
  return [];
}

function asConnections(a: UserAnswer | undefined): { left: string; right: string }[] {
  if (a && typeof a === "object" && "connections" in a) {
    return (a as { connections: { left: string; right: string }[] }).connections;
  }
  return [];
}

export function AnswerInput({ exercise, onChange, onSubmit, disabled }: AnswerInputProps) {
  const cardType = exercise.cardType ?? inferCardType(exercise);

  switch (cardType) {
    case "multipleChoice":
      return <MultipleChoice exercise={exercise} value={asString(exercise.userAnswer)} onChange={onChange} disabled={disabled} />;
    case "numberInput":
      return (
        <NumericKeypad
          value={asString(exercise.userAnswer)}
          onChange={(v) => onChange(v.length ? v : undefined)}
          onSubmit={onSubmit}
          allowDecimal
          allowNegative
        />
      );
    case "textInput":
      return <TextAnswer value={asString(exercise.userAnswer)} onChange={(v) => onChange(v.length ? v : undefined)} />;
    case "tapToMark":
      return (
        <TapToMarkInput
          items={exercise.tapToMarkItems ?? []}
          selectedIds={asMarked(exercise.userAnswer)}
          onChange={(ids) => onChange(ids.length ? { marked: ids } : undefined)}
        />
      );
    case "connectPairs":
      return (
        <ConnectPairs
          exercise={exercise}
          connections={asConnections(exercise.userAnswer)}
          onChange={(c) => onChange(c.length ? { connections: c } : undefined)}
        />
      );
    case "freeDrawing":
      return <FreeDrawing exercise={exercise} onChange={onChange} />;
    default:
      return null;
  }
}

function inferCardType(exercise: Exercise): Exercise["cardType"] {
  if (exercise.type === "multiple-choice" || exercise.options?.length) return "multipleChoice";
  if (exercise.answer && /^-?\d+(\.\d+)?$/.test(exercise.answer.trim())) return "numberInput";
  return "textInput";
}

function MultipleChoice({
  exercise,
  value,
  onChange,
  disabled,
}: {
  exercise: Exercise;
  value: string;
  onChange: (a: UserAnswer | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.mcWrap}>
      {(exercise.options ?? []).map((option) => {
        const active = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(active ? undefined : option)}
            disabled={disabled}
            style={[styles.mcOption, active && styles.mcOptionActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.mcDot, active && styles.mcDotActive]}>
              {active && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <Text style={[styles.mcText, active && styles.mcTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TextAnswer({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Type your answer"
      placeholderTextColor={C.inkMuted}
      autoCorrect={false}
      autoCapitalize="none"
      style={styles.textInput}
    />
  );
}

function ConnectPairs({
  exercise,
  connections,
  onChange,
}: {
  exercise: Exercise;
  connections: { left: string; right: string }[];
  onChange: (c: { left: string; right: string }[]) => void;
}) {
  const lefts = (exercise.pairs ?? []).map((p) => p.left);
  const rights = (exercise.pairs ?? []).map((p) => p.right);
  return (
    <ConnectPairsInput leftItems={lefts} rightItems={rights} connections={connections} onChange={onChange} />
  );
}

function FreeDrawing({
  exercise,
  onChange,
}: {
  exercise: Exercise;
  onChange: (a: UserAnswer | undefined) => void;
}) {
  const ref = useRef<DrawingCanvasHandle>(null);
  const handleChange = useCallback(
    (strokes: Stroke[]) => {
      onChange(strokes.length ? { strokes } : undefined);
    },
    [onChange],
  );
  return (
    <View>
      {exercise.drawingPrompt && (
        <Text style={styles.drawingPrompt}>{exercise.drawingPrompt}</Text>
      )}
      <DrawingCanvas ref={ref} onChange={handleChange} height={320} />
    </View>
  );
}

const styles = StyleSheet.create({
  mcWrap: {
    gap: 8,
  },
  mcOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.hairline,
    backgroundColor: C.card,
  },
  mcOptionActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryTint,
  },
  mcDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: C.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  mcDotActive: {
    backgroundColor: C.primary,
    borderColor: C.primaryDark,
  },
  mcText: {
    flex: 1,
    fontFamily: F.bodySemi,
    fontSize: 15,
    color: C.ink,
  },
  mcTextActive: {
    color: C.primaryDark,
  },
  textInput: {
    fontFamily: F.bodyMedium,
    fontSize: 16,
    color: C.ink,
    borderWidth: 1,
    borderColor: C.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: C.surface,
  },
  drawingPrompt: {
    fontFamily: F.bodyMedium,
    fontSize: 13,
    color: C.inkBody,
    marginBottom: 8,
  },
});

export default AnswerInput;
