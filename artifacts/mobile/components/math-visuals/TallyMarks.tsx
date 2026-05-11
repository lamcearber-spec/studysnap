import React from "react";
import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { C } from "@/app/_components/tokens";

/**
 * TallyMarks — slash counting, groups of 5 (4 vertical + 1 diagonal).
 * AI returns: { count: 13 }
 */
export type TallyMarksProps = {
  count: number;
  size?: number;
};

export function TallyMarks({ count, size = 36 }: TallyMarksProps) {
  const safe = Math.max(0, Math.min(50, count));
  const groups = Math.floor(safe / 5);
  const remainder = safe % 5;
  const totalGroups = remainder > 0 ? groups + 1 : groups;

  const groupW = size * 1.5;
  const gap = size * 0.4;
  const perRow = 5;
  const rows = Math.max(1, Math.ceil(totalGroups / perRow));
  const cellW = groupW + gap;
  const width = Math.max(cellW, perRow * cellW);
  const height = rows * (size + gap);
  const strokeW = Math.max(2, size * 0.07);

  function renderGroup(gIdx: number, n: number) {
    const col = gIdx % perRow;
    const row = Math.floor(gIdx / perRow);
    const baseX = col * cellW + gap / 2;
    const baseY = row * (size + gap) + size * 0.1;
    const verticals = Math.min(4, n);
    const hasDiag = n === 5;

    return (
      <React.Fragment key={gIdx}>
        {Array.from({ length: verticals }).map((_, i) => {
          const x = baseX + i * (size * 0.22);
          return (
            <Line
              key={`v${i}`}
              x1={x}
              y1={baseY}
              x2={x}
              y2={baseY + size * 0.8}
              stroke={C.ink}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          );
        })}
        {hasDiag && (
          <Line
            x1={baseX - size * 0.05}
            y1={baseY + size * 0.7}
            x2={baseX + size * 0.22 * 3 + size * 0.05}
            y2={baseY + size * 0.1}
            stroke={C.ink}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
      </React.Fragment>
    );
  }

  const renderedGroups: React.ReactNode[] = [];
  for (let i = 0; i < groups; i++) renderedGroups.push(renderGroup(i, 5));
  if (remainder > 0) renderedGroups.push(renderGroup(groups, remainder));

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {renderedGroups}
      </Svg>
    </View>
  );
}

export default TallyMarks;
