import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { C, F } from "@/app/_components/tokens";
import type { TapToMarkItem } from "@/context/SessionContext";

type TapToMarkInputProps = {
  items: TapToMarkItem[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
};

const isWeb = Platform.OS === "web";

export function TapToMarkInput({ items, selectedIds, onChange }: TapToMarkInputProps) {
  const selected = new Set(selectedIds);

  const toggle = useCallback(
    (id: string) => {
      if (!isWeb) Haptics.selectionAsync();
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onChange(Array.from(next));
    },
    [selected, onChange],
  );

  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const active = selected.has(item.id);
        return (
          <Pressable
            key={item.id}
            onPress={() => toggle(item.id)}
            style={[styles.cell, active && styles.cellActive]}
            accessibilityRole="checkbox"
            accessibilityLabel={item.label}
            accessibilityState={{ checked: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            {active && (
              <View style={styles.circle}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cell: {
    minWidth: 80,
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.hairline,
    backgroundColor: C.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    flexBasis: "28%",
  },
  cellActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryTint,
  },
  label: {
    fontFamily: F.bodySemi,
    fontSize: 16,
    color: C.ink,
    textAlign: "center",
  },
  labelActive: {
    color: C.primaryDark,
  },
  circle: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TapToMarkInput;
