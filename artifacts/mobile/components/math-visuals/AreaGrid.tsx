import React from "react";
import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { C } from "@/app/_components/tokens";

/**
 * AreaGrid — N×M grid for area/perimeter exercises.
 * AI returns: { rows: 4, cols: 6, shaded: [0, 1, 7] } (cell indices to shade)
 */
export type AreaGridProps = {
  rows: number;
  cols: number;
  shaded?: number[];
  cellSize?: number;
};

export function AreaGrid({ rows, cols, shaded = [], cellSize = 30 }: AreaGridProps) {
  const safeRows = Math.max(1, Math.min(12, rows));
  const safeCols = Math.max(1, Math.min(12, cols));
  const shadedSet = new Set(shaded);
  const width = safeCols * cellSize;
  const height = safeRows * cellSize;

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < safeRows; r++) {
    for (let c = 0; c < safeCols; c++) {
      const idx = r * safeCols + c;
      const isShaded = shadedSet.has(idx);
      cells.push(
        <Rect
          key={idx}
          x={c * cellSize}
          y={r * cellSize}
          width={cellSize}
          height={cellSize}
          fill={isShaded ? C.primaryFixedDim : C.surface}
          stroke={C.ink}
          strokeWidth={1.5}
        />,
      );
    }
  }

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {cells}
      </Svg>
    </View>
  );
}

export default AreaGrid;
