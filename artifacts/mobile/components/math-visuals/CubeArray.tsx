import React from "react";
import { View } from "react-native";
import Svg, { Rect, Polygon } from "react-native-svg";
import { C } from "@/app/_components/tokens";

/**
 * CubeArray — N stacked cubes in a grid or row.
 * AI returns: { count: 7, layout: "2x3+1" } (rows × cols, optional +N trailing)
 * or { count: 5, layout: "row" } for a horizontal line.
 */
export type CubeArrayProps = {
  count: number;
  layout?: string; // e.g. "2x3+1" | "row" | "column"
  size?: number;
};

function parseLayout(count: number, layout: string | undefined): number[][] {
  if (!layout || layout === "row") return [Array(count).fill(0)];
  if (layout === "column") return Array(count).fill([0]);

  // Pattern: "RxC[+T]" — R rows of C, optional T trailing in a partial row
  const match = /^(\d+)x(\d+)(?:\+(\d+))?$/.exec(layout);
  if (!match) return [Array(count).fill(0)];
  const rows = Number(match[1]);
  const cols = Number(match[2]);
  const trailing = match[3] ? Number(match[3]) : 0;
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) grid.push(Array(cols).fill(0));
  if (trailing > 0) grid.push(Array(trailing).fill(0));
  return grid;
}

export function CubeArray({ count, layout, size = 36 }: CubeArrayProps) {
  const grid = parseLayout(count, layout);
  const cols = Math.max(...grid.map((r) => r.length));
  const rows = grid.length;
  const gap = size * 0.15;
  const cubeBox = size + gap;
  const width = cols * cubeBox - gap;
  const height = rows * cubeBox - gap;

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={width} height={height + size * 0.4} viewBox={`0 0 ${width} ${height + size * 0.4}`}>
        {grid.map((row, rowIdx) =>
          row.map((_, colIdx) => {
            const x = colIdx * cubeBox;
            const y = rowIdx * cubeBox;
            // Isometric-ish cube with top + side highlight
            const front = `${x},${y + size * 0.2} ${x + size * 0.8},${y + size * 0.2} ${x + size * 0.8},${y + size} ${x},${y + size}`;
            const top = `${x},${y + size * 0.2} ${x + size * 0.2},${y} ${x + size},${y} ${x + size * 0.8},${y + size * 0.2}`;
            const side = `${x + size * 0.8},${y + size * 0.2} ${x + size},${y} ${x + size},${y + size * 0.8} ${x + size * 0.8},${y + size}`;
            return (
              <React.Fragment key={`${rowIdx}-${colIdx}`}>
                <Polygon points={front} fill={C.primary} />
                <Polygon points={top} fill={C.primaryFixedDim} />
                <Polygon points={side} fill={C.primaryDark} />
              </React.Fragment>
            );
          }),
        )}
      </Svg>
    </View>
  );
}

export default CubeArray;
