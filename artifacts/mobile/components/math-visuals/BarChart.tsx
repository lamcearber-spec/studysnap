import React from "react";
import { View } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { C, F } from "@/app/_components/tokens";

/**
 * BarChart — vertical bars with category labels + y-axis ticks.
 * AI returns: { bars: [{ label: "Apples", value: 5 }, ...], max?: 10 }
 */
export type BarChartProps = {
  bars: { label: string; value: number }[];
  max?: number;
  size?: number;
};

export function BarChart({ bars, max, size = 220 }: BarChartProps) {
  const safe = bars.slice(0, 8);
  const computedMax = max ?? Math.max(1, ...safe.map((b) => b.value));
  const padding = 24;
  const axisGutter = 30;
  const width = Math.max(size, safe.length * 50 + axisGutter + padding);
  const height = size;
  const plotW = width - axisGutter - padding;
  const plotH = height - 40;
  const plotX = axisGutter;
  const plotY = 8;
  const slot = plotW / safe.length;
  const barW = Math.min(36, slot * 0.6);
  const tickCount = Math.min(5, computedMax);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((computedMax / tickCount) * i),
  );

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Y-axis ticks + gridlines */}
        {ticks.map((tick, i) => {
          const y = plotY + plotH - (tick / computedMax) * plotH;
          return (
            <React.Fragment key={i}>
              <Line x1={plotX} y1={y} x2={plotX + plotW} y2={y} stroke={C.hairline} strokeWidth={1} />
              <SvgText
                x={plotX - 6}
                y={y + 4}
                fontFamily={F.body}
                fontSize={11}
                fill={C.inkMuted}
                textAnchor="end"
              >
                {tick}
              </SvgText>
            </React.Fragment>
          );
        })}
        {/* Axis lines */}
        <Line x1={plotX} y1={plotY} x2={plotX} y2={plotY + plotH} stroke={C.ink} strokeWidth={1.5} />
        <Line x1={plotX} y1={plotY + plotH} x2={plotX + plotW} y2={plotY + plotH} stroke={C.ink} strokeWidth={1.5} />
        {/* Bars */}
        {safe.map((b, i) => {
          const h = (b.value / computedMax) * plotH;
          const x = plotX + i * slot + (slot - barW) / 2;
          const y = plotY + plotH - h;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={barW} height={h} fill={C.primary} rx={2} />
              <SvgText
                x={x + barW / 2}
                y={plotY + plotH + 16}
                fontFamily={F.bodyMedium}
                fontSize={11}
                fill={C.inkBody}
                textAnchor="middle"
              >
                {b.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export default BarChart;
