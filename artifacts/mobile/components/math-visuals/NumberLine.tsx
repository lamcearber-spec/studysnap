import React from "react";
import { View } from "react-native";
import Svg, { Line, Circle, Text as SvgText } from "react-native-svg";
import { C } from "@/app/_components/tokens";

/**
 * NumberLine — labeled tick marks with optional point markers.
 * AI returns: { min: 0, max: 20, marks: [3, 7, 12] }
 */
export type NumberLineProps = {
  min: number;
  max: number;
  marks?: number[];
};

export function NumberLine({ min, max, marks = [] }: NumberLineProps) {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const range = safeMax - safeMin;
  if (range === 0) return null;

  const width = 320;
  const height = 80;
  const padX = 20;
  const lineY = 36;
  const innerW = width - padX * 2;
  const step = innerW / range;

  // Pick tick density — every 1 if range ≤ 20, every 2 if ≤ 50, every 5 otherwise
  const tickEvery = range <= 20 ? 1 : range <= 50 ? 2 : 5;

  const ticks: number[] = [];
  for (let v = safeMin; v <= safeMax; v += tickEvery) ticks.push(v);
  if (ticks[ticks.length - 1] !== safeMax) ticks.push(safeMax);

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={padX} y1={lineY} x2={width - padX} y2={lineY} stroke={C.ink} strokeWidth={2.5} />
        {ticks.map((v) => {
          const x = padX + (v - safeMin) * step;
          return (
            <React.Fragment key={v}>
              <Line x1={x} y1={lineY - 8} x2={x} y2={lineY + 8} stroke={C.ink} strokeWidth={2} />
              <SvgText x={x} y={lineY + 26} fontSize={12} fill={C.inkBody} textAnchor="middle">
                {v}
              </SvgText>
            </React.Fragment>
          );
        })}
        {marks.map((m, i) => {
          if (m < safeMin || m > safeMax) return null;
          const x = padX + (m - safeMin) * step;
          return <Circle key={`mark-${i}`} cx={x} cy={lineY} r={7} fill={C.primary} stroke={C.primaryShadow} strokeWidth={2} />;
        })}
      </Svg>
    </View>
  );
}

export default NumberLine;
