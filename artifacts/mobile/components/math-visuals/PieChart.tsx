import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";
import { C, F } from "@/app/_components/tokens";

/**
 * PieChart — proportional pie chart with labels.
 * AI returns: { slices: [{ label: "Red", value: 3 }, { label: "Blue", value: 1 }] }
 */
export type PieChartProps = {
  slices: { label: string; value: number }[];
  size?: number;
};

const PALETTE = [
  "#A76A4A", // marmot brown
  "#FFB627", // citrus
  "#7BB37A", // sage
  "#E0533D", // cardinal
  "#D6A98C", // primaryFixedDim
  "#8A5538", // primaryDark
  "#FFE4A8", // yellowSoft
  "#5C9659", // successDark
];

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function PieChart({ slices, size = 200 }: PieChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  let angle = -Math.PI / 2;
  const paths = slices.map((s, i) => {
    const slice = (s.value / total) * Math.PI * 2;
    const end = angle + slice;
    const labelAngle = angle + slice / 2;
    const lx = cx + (r * 0.65) * Math.cos(labelAngle);
    const ly = cy + (r * 0.65) * Math.sin(labelAngle);
    const path = arcPath(cx, cy, r, angle, end);
    angle = end;
    return { path, color: PALETTE[i % PALETTE.length], lx, ly, value: s.value };
  });

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={size} height={size + slices.length * 16} viewBox={`0 0 ${size} ${size + slices.length * 16}`}>
        {paths.map((p, i) => (
          <Path key={i} d={p.path} fill={p.color} stroke={C.surface} strokeWidth={2} />
        ))}
        {paths.map((p, i) => (
          <SvgText
            key={`l${i}`}
            x={p.lx}
            y={p.ly + 4}
            fontFamily={F.bodyBold}
            fontSize={13}
            fill={C.surface}
            textAnchor="middle"
          >
            {p.value}
          </SvgText>
        ))}
        {/* Legend */}
        {slices.map((s, i) => {
          const ly = size + 14 + i * 16;
          return (
            <React.Fragment key={`leg${i}`}>
              <Circle cx={size * 0.15} cy={ly - 4} r={6} fill={PALETTE[i % PALETTE.length]} />
              <SvgText
                x={size * 0.15 + 14}
                y={ly}
                fontFamily={F.bodyMedium}
                fontSize={12}
                fill={C.inkBody}
              >
                {s.label} ({s.value})
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export default PieChart;
