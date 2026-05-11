import React from "react";
import { View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import { C } from "@/app/_components/tokens";

/**
 * DotArray / TenFrame — N dots in a 10-frame, grid, or row.
 * AI returns: { count: 13, frameType: "tenFrame" | "grid" | "row" }
 */
export type DotArrayProps = {
  count: number;
  frameType?: "tenFrame" | "grid" | "row";
};

export function DotArray({ count, frameType = "tenFrame" }: DotArrayProps) {
  const dotR = 12;
  const cellSize = 36;
  const safeCount = Math.max(0, Math.min(count, 30));

  if (frameType === "row") {
    const width = safeCount * cellSize;
    return (
      <View style={{ alignItems: "center", padding: 12 }}>
        <Svg width={width} height={cellSize} viewBox={`0 0 ${width} ${cellSize}`}>
          {Array.from({ length: safeCount }).map((_, i) => (
            <Circle key={i} cx={i * cellSize + cellSize / 2} cy={cellSize / 2} r={dotR} fill={C.primary} />
          ))}
        </Svg>
      </View>
    );
  }

  // tenFrame or grid — 2 rows × 5 cols per group of 10
  const groupsOfTen = Math.ceil(safeCount / 10);
  const width = 5 * cellSize;
  const height = 2 * cellSize * groupsOfTen + (groupsOfTen - 1) * 12;

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: groupsOfTen }).map((_, groupIdx) => {
          const groupYOffset = groupIdx * (2 * cellSize + 12);
          const startN = groupIdx * 10;
          return (
            <React.Fragment key={groupIdx}>
              {/* Frame outline */}
              <Rect x={0} y={groupYOffset} width={width} height={2 * cellSize} fill="none" stroke={C.hairline} strokeWidth={2} rx={4} />
              {/* Divider lines */}
              {[1, 2, 3, 4].map((c) => (
                <Rect key={c} x={c * cellSize - 0.5} y={groupYOffset} width={1} height={2 * cellSize} fill={C.hairline} />
              ))}
              <Rect x={0} y={groupYOffset + cellSize - 0.5} width={width} height={1} fill={C.hairline} />
              {/* Dots */}
              {Array.from({ length: 10 }).map((_, slot) => {
                const n = startN + slot;
                if (n >= safeCount) return null;
                const row = slot < 5 ? 0 : 1;
                const col = slot % 5;
                return (
                  <Circle
                    key={slot}
                    cx={col * cellSize + cellSize / 2}
                    cy={groupYOffset + row * cellSize + cellSize / 2}
                    r={dotR}
                    fill={C.primary}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export default DotArray;
