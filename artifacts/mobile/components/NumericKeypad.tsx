import React, { useCallback } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { C, F } from "@/app/_components/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const isWeb = Platform.OS === "web";

type NumericKeypadProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  maxLength?: number;
  placeholder?: string;
  submitDisabled?: boolean;
  submitLabel?: string;
};

type Key =
  | { kind: "digit"; label: string }
  | { kind: "decimal" }
  | { kind: "negative" }
  | { kind: "back" }
  | { kind: "submit" };

function KeyButton({
  children,
  onPress,
  tone = "neutral",
  flex = 1,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress: () => void;
  tone?: "neutral" | "primary" | "muted";
  flex?: number;
  accessibilityLabel: string;
}) {
  const press = useSharedValue(0);
  const scale = useSharedValue(1);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(press.value, [0, 1], [0, 2]) },
      { scale: scale.value },
    ],
  }));
  const ledgeStyle = useAnimatedStyle(() => ({
    height: interpolate(press.value, [0, 1], [4, 2]),
  }));

  const palette =
    tone === "primary"
      ? { face: C.primary, ledge: C.primaryShadow, text: "#FFFFFF" }
      : tone === "muted"
        ? { face: C.surfaceLow, ledge: C.hairline, text: C.inkBody }
        : { face: C.card, ledge: C.hairline, text: C.ink };

  return (
    <AnimatedPressable
      style={[styles.keyWrap, { flex }]}
      onPressIn={() => {
        if (!isWeb) Haptics.selectionAsync();
        press.value = withTiming(1, { duration: 60 });
        scale.value = withSpring(0.97, { stiffness: 320, damping: 20 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { stiffness: 320, damping: 20 });
        scale.value = withSpring(1, { stiffness: 320, damping: 20 });
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.keyLedge, { backgroundColor: palette.ledge }, ledgeStyle]} />
      <Animated.View style={[styles.keyFace, { backgroundColor: palette.face }, faceStyle]}>
        {typeof children === "string" ? (
          <Text style={[styles.keyLabel, { color: palette.text }]}>{children}</Text>
        ) : (
          children
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

export function NumericKeypad({
  value,
  onChange,
  onSubmit,
  allowDecimal = false,
  allowNegative = false,
  maxLength = 8,
  placeholder = "—",
  submitDisabled,
  submitLabel = "Done",
}: NumericKeypadProps) {
  const handleDigit = useCallback(
    (digit: string) => {
      if (value.replace(/[^\d]/g, "").length >= maxLength) return;
      if (value === "0" && digit !== ".") {
        onChange(digit);
        return;
      }
      onChange(value + digit);
    },
    [value, maxLength, onChange],
  );

  const handleDecimal = useCallback(() => {
    if (!allowDecimal) return;
    if (value.includes(".")) return;
    onChange((value || "0") + ".");
  }, [value, allowDecimal, onChange]);

  const handleNegative = useCallback(() => {
    if (!allowNegative) return;
    onChange(value.startsWith("-") ? value.slice(1) : "-" + value);
  }, [value, allowNegative, onChange]);

  const handleBack = useCallback(() => {
    if (value.length === 0) return;
    onChange(value.slice(0, -1));
  }, [value, onChange]);

  const handleSubmit = useCallback(() => {
    if (submitDisabled) return;
    onSubmit?.();
  }, [onSubmit, submitDisabled]);

  const leftKey: Key = allowDecimal
    ? { kind: "decimal" }
    : allowNegative
      ? { kind: "negative" }
      : { kind: "digit", label: "" };

  return (
    <View style={styles.wrap}>
      <View style={styles.display}>
        <Text
          style={[
            styles.displayText,
            { color: value.length === 0 ? C.inkMuted : C.ink },
          ]}
        >
          {value.length === 0 ? placeholder : value}
        </Text>
      </View>

      <View style={styles.row}>
        <KeyButton onPress={() => handleDigit("1")} accessibilityLabel="1">1</KeyButton>
        <KeyButton onPress={() => handleDigit("2")} accessibilityLabel="2">2</KeyButton>
        <KeyButton onPress={() => handleDigit("3")} accessibilityLabel="3">3</KeyButton>
      </View>
      <View style={styles.row}>
        <KeyButton onPress={() => handleDigit("4")} accessibilityLabel="4">4</KeyButton>
        <KeyButton onPress={() => handleDigit("5")} accessibilityLabel="5">5</KeyButton>
        <KeyButton onPress={() => handleDigit("6")} accessibilityLabel="6">6</KeyButton>
      </View>
      <View style={styles.row}>
        <KeyButton onPress={() => handleDigit("7")} accessibilityLabel="7">7</KeyButton>
        <KeyButton onPress={() => handleDigit("8")} accessibilityLabel="8">8</KeyButton>
        <KeyButton onPress={() => handleDigit("9")} accessibilityLabel="9">9</KeyButton>
      </View>
      <View style={styles.row}>
        {leftKey.kind === "decimal" && (
          <KeyButton onPress={handleDecimal} tone="muted" accessibilityLabel="Decimal point">.</KeyButton>
        )}
        {leftKey.kind === "negative" && (
          <KeyButton onPress={handleNegative} tone="muted" accessibilityLabel="Negative">±</KeyButton>
        )}
        {leftKey.kind === "digit" && (
          <KeyButton onPress={handleBack} tone="muted" accessibilityLabel="Backspace">
            <Ionicons name="backspace-outline" size={26} color={C.inkBody} />
          </KeyButton>
        )}
        <KeyButton onPress={() => handleDigit("0")} accessibilityLabel="0">0</KeyButton>
        {leftKey.kind === "digit" ? (
          onSubmit ? (
            <KeyButton onPress={handleSubmit} tone="primary" accessibilityLabel={submitLabel}>
              {submitLabel}
            </KeyButton>
          ) : (
            <KeyButton onPress={handleBack} tone="muted" accessibilityLabel="Backspace">
              <Ionicons name="backspace-outline" size={26} color={C.inkBody} />
            </KeyButton>
          )
        ) : (
          <KeyButton onPress={handleBack} tone="muted" accessibilityLabel="Backspace">
            <Ionicons name="backspace-outline" size={26} color={C.inkBody} />
          </KeyButton>
        )}
      </View>
      {onSubmit && leftKey.kind !== "digit" && (
        <View style={styles.row}>
          <KeyButton onPress={handleSubmit} tone="primary" flex={3} accessibilityLabel={submitLabel}>
            {submitLabel}
          </KeyButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  display: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.surface,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  displayText: {
    fontFamily: F.display,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  keyWrap: {
    minHeight: 56,
    position: "relative",
  },
  keyLedge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  keyFace: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.hairline,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 14,
  },
  keyLabel: {
    fontFamily: F.display,
    fontSize: 22,
    letterSpacing: 0,
  },
});

export default NumericKeypad;
