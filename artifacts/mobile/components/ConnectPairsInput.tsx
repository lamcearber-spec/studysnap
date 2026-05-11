import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Svg, { Line } from "react-native-svg";
import { C, F } from "@/app/_components/tokens";

type Connection = { left: string; right: string };

type ConnectPairsInputProps = {
  leftItems: string[];
  rightItems: string[];
  connections: Connection[];
  onChange: (next: Connection[]) => void;
};

const isWeb = Platform.OS === "web";
const ROW_HEIGHT = 56;
const ITEM_WIDTH = 130;
const GAP = 64;

const PALETTE = [C.primary, C.success, "#4A8AC9", "#9166C9", C.yellowDeep, C.errorDark, "#5C9659", "#F08840"];

export function ConnectPairsInput({ leftItems, rightItems, connections, onChange }: ConnectPairsInputProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const handleLeft = useCallback(
    (label: string) => {
      if (!isWeb) Haptics.selectionAsync();
      setSelectedLeft((prev) => (prev === label ? null : label));
    },
    [],
  );

  const handleRight = useCallback(
    (label: string) => {
      if (!isWeb) Haptics.selectionAsync();
      if (!selectedLeft) {
        // Tapping a right with no pending left: remove its existing connection
        const next = connections.filter((c) => c.right !== label);
        if (next.length !== connections.length) onChange(next);
        return;
      }
      const next = connections
        .filter((c) => c.left !== selectedLeft && c.right !== label)
        .concat({ left: selectedLeft, right: label });
      onChange(next);
      setSelectedLeft(null);
    },
    [selectedLeft, connections, onChange],
  );

  const leftPositions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    leftItems.forEach((label, i) => {
      m.set(label, { x: ITEM_WIDTH, y: i * (ROW_HEIGHT + 8) + ROW_HEIGHT / 2 });
    });
    return m;
  }, [leftItems]);

  const rightPositions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    rightItems.forEach((label, i) => {
      m.set(label, { x: ITEM_WIDTH + GAP, y: i * (ROW_HEIGHT + 8) + ROW_HEIGHT / 2 });
    });
    return m;
  }, [rightItems]);

  const totalRows = Math.max(leftItems.length, rightItems.length);
  const height = totalRows * (ROW_HEIGHT + 8);
  const width = ITEM_WIDTH * 2 + GAP;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        {connections.map((c, i) => {
          const a = leftPositions.get(c.left);
          const b = rightPositions.get(c.right);
          if (!a || !b) return null;
          return (
            <Line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>

      <View style={styles.column}>
        {leftItems.map((label) => {
          const active = selectedLeft === label;
          const connected = connections.some((c) => c.left === label);
          return (
            <Pressable
              key={label}
              onPress={() => handleLeft(label)}
              style={[
                styles.item,
                connected && styles.itemConnected,
                active && styles.itemActive,
                { width: ITEM_WIDTH - 4 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Match ${label}`}
            >
              <Text style={styles.itemText}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.column, { left: ITEM_WIDTH + GAP }]}>
        {rightItems.map((label) => {
          const connected = connections.some((c) => c.right === label);
          return (
            <Pressable
              key={label}
              onPress={() => handleRight(label)}
              style={[
                styles.item,
                connected && styles.itemConnected,
                { width: ITEM_WIDTH - 4 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Match to ${label}`}
            >
              <Text style={styles.itemText}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    position: "relative",
  },
  column: {
    position: "absolute",
    top: 0,
    gap: 8,
  },
  item: {
    height: ROW_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.hairline,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  itemActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryTint,
  },
  itemConnected: {
    borderColor: C.primaryBorderTint,
    backgroundColor: C.card,
  },
  itemText: {
    fontFamily: F.bodySemi,
    fontSize: 14,
    color: C.ink,
    textAlign: "center",
  },
});

export default ConnectPairsInput;
