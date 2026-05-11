import React from "react";
import { View } from "react-native";
import Svg, { Rect, Circle, Polygon, Text as SvgText } from "react-native-svg";
import { C, F } from "@/app/_components/tokens";

/**
 * PatternSequence — visual sequence with one missing element marked "?".
 * AI returns: { items: ["circle:red", "square:blue", "?", "square:blue"] }
 * Item syntax: "<shape>:<color>" or "?" for the unknown slot.
 * Shapes: circle, square, triangle. Colors: red, blue, green, yellow, brown.
 */
export type PatternSequenceProps = {
  items: string[];
  size?: number;
};

const COLOR_MAP: Record<string, string> = {
  red: C.error,
  blue: "#4A8AC9",
  green: C.success,
  yellow: C.yellow,
  brown: C.primary,
  orange: "#F08840",
  purple: "#9166C9",
};

function renderItem(token: string, cx: number, cy: number, r: number, key: number) {
  if (token === "?" || token === "") {
    return (
      <React.Fragment key={key}>
        <Rect
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          rx={r * 0.2}
          fill={C.surfaceLow}
          stroke={C.ink}
          strokeWidth={2}
          strokeDasharray="6,4"
        />
        <SvgText
          x={cx}
          y={cy + r * 0.45}
          fontFamily={F.display}
          fontSize={r * 1.2}
          fill={C.ink}
          textAnchor="middle"
        >
          ?
        </SvgText>
      </React.Fragment>
    );
  }
  const [shape, color] = token.split(":");
  const fill = COLOR_MAP[color] ?? C.primary;
  switch (shape) {
    case "circle":
      return (
        <Circle key={key} cx={cx} cy={cy} r={r} fill={fill} stroke={C.ink} strokeWidth={1.5} />
      );
    case "triangle": {
      const points = `${cx},${cy - r} ${cx + r * 0.95},${cy + r * 0.85} ${cx - r * 0.95},${cy + r * 0.85}`;
      return <Polygon key={key} points={points} fill={fill} stroke={C.ink} strokeWidth={1.5} />;
    }
    case "square":
    default:
      return (
        <Rect
          key={key}
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          rx={r * 0.15}
          fill={fill}
          stroke={C.ink}
          strokeWidth={1.5}
        />
      );
  }
}

export function PatternSequence({ items, size = 40 }: PatternSequenceProps) {
  const safe = items.slice(0, 10);
  const gap = size * 0.5;
  const cellW = size * 2 + gap;
  const width = safe.length * cellW;
  const height = size * 2 + 16;
  const r = size;

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {safe.map((token, i) => {
          const cx = i * cellW + cellW / 2;
          const cy = height / 2;
          return renderItem(token, cx, cy, r, i);
        })}
      </Svg>
    </View>
  );
}

export default PatternSequence;
