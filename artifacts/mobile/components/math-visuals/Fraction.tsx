import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path, Rect, Line, Text as SvgText } from "react-native-svg";
import { C } from "@/app/_components/tokens";

/**
 * Fraction — pie / bar / number-line representation.
 * AI returns: { whole: 4, parts: 1, style: "pie" | "bar" | "numberLine" }
 * whole = denominator (total slices), parts = numerator (filled slices).
 */
export type FractionProps = {
  whole: number;
  parts: number;
  style?: "pie" | "bar" | "numberLine";
};

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const polarToCartesian = (angle: number) => ({
    x: cx + r * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + r * Math.sin((angle - 90) * (Math.PI / 180)),
  });
  const start = polarToCartesian(endAngle);
  const end = polarToCartesian(startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function Fraction({ whole, parts, style = "pie" }: FractionProps) {
  const safeWhole = Math.max(1, whole);
  const safeParts = Math.max(0, Math.min(safeWhole, parts));

  if (style === "bar") {
    const width = 240;
    const height = 56;
    const slotWidth = width / safeWhole;
    return (
      <View style={{ alignItems: "center", padding: 12 }}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {Array.from({ length: safeWhole }).map((_, i) => (
            <Rect
              key={i}
              x={i * slotWidth}
              y={0}
              width={slotWidth - 1}
              height={height}
              fill={i < safeParts ? C.primary : C.surfaceHigh}
              stroke={C.ink}
              strokeWidth={1.5}
            />
          ))}
        </Svg>
      </View>
    );
  }

  if (style === "numberLine") {
    const width = 280;
    const height = 64;
    const lineY = 40;
    const padX = 14;
    const innerW = width - padX * 2;
    const stepX = innerW / safeWhole;
    return (
      <View style={{ alignItems: "center", padding: 12 }}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Line x1={padX} y1={lineY} x2={width - padX} y2={lineY} stroke={C.ink} strokeWidth={2} />
          {Array.from({ length: safeWhole + 1 }).map((_, i) => (
            <Line
              key={i}
              x1={padX + i * stepX}
              y1={lineY - 8}
              x2={padX + i * stepX}
              y2={lineY + 8}
              stroke={C.ink}
              strokeWidth={2}
            />
          ))}
          <SvgText x={padX} y={lineY + 24} fontSize={12} fill={C.inkMuted} textAnchor="middle">0</SvgText>
          <SvgText x={width - padX} y={lineY + 24} fontSize={12} fill={C.inkMuted} textAnchor="middle">1</SvgText>
          <Circle cx={padX + safeParts * stepX} cy={lineY} r={8} fill={C.primary} />
        </Svg>
      </View>
    );
  }

  // pie (default)
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const anglePerSlice = 360 / safeWhole;

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={r} fill={C.surfaceHigh} stroke={C.ink} strokeWidth={2} />
        {Array.from({ length: safeWhole }).map((_, i) => {
          const startAngle = i * anglePerSlice;
          const endAngle = (i + 1) * anglePerSlice;
          const d = describeArc(cx, cy, r, startAngle, endAngle);
          return (
            <Path key={i} d={d} fill={i < safeParts ? C.primary : "transparent"} stroke={C.ink} strokeWidth={1.5} />
          );
        })}
      </Svg>
    </View>
  );
}

export default Fraction;
