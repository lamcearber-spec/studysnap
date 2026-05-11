import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { C, F } from "@/app/_components/tokens";

/**
 * Clock — analog or digital, exact hand angles.
 * AI returns: { hours: 3, minutes: 30, style: "analog" | "digital" }
 */
export type ClockProps = {
  hours: number;
  minutes: number;
  style?: "analog" | "digital";
};

export function Clock({ hours, minutes, style = "analog" }: ClockProps) {
  const safeHours = ((hours % 12) + 12) % 12;
  const safeMinutes = Math.max(0, Math.min(59, minutes));

  if (style === "digital") {
    const hh = String(safeHours === 0 ? 12 : safeHours).padStart(2, "0");
    const mm = String(safeMinutes).padStart(2, "0");
    return (
      <View
        style={{
          alignItems: "center",
          padding: 12,
        }}
      >
        <View
          style={{
            backgroundColor: C.ink,
            paddingHorizontal: 32,
            paddingVertical: 18,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              fontFamily: F.display,
              color: C.surface,
              fontSize: 48,
              letterSpacing: 4,
            }}
          >
            {hh}:{mm}
          </Text>
        </View>
      </View>
    );
  }

  // analog
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const minuteAngle = (safeMinutes / 60) * 360 - 90;
  const hourAngle = ((safeHours + safeMinutes / 60) / 12) * 360 - 90;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const hourLen = r * 0.5;
  const minuteLen = r * 0.78;

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={r} fill={C.surface} stroke={C.ink} strokeWidth={3} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * 360 - 90;
          const x1 = cx + (r - 8) * Math.cos(toRad(a));
          const y1 = cy + (r - 8) * Math.sin(toRad(a));
          const x2 = cx + r * Math.cos(toRad(a));
          const y2 = cy + r * Math.sin(toRad(a));
          return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.ink} strokeWidth={2.5} />;
        })}
        {[12, 3, 6, 9].map((num) => {
          const angle = ((num % 12) / 12) * 360 - 90;
          const x = cx + (r - 22) * Math.cos(toRad(angle));
          const y = cy + (r - 22) * Math.sin(toRad(angle)) + 6;
          return (
            <SvgText key={num} x={x} y={y} fontSize={16} fill={C.ink} textAnchor="middle" fontWeight="bold">
              {num}
            </SvgText>
          );
        })}
        <Line
          x1={cx}
          y1={cy}
          x2={cx + hourLen * Math.cos(toRad(hourAngle))}
          y2={cy + hourLen * Math.sin(toRad(hourAngle))}
          stroke={C.ink}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <Line
          x1={cx}
          y1={cy}
          x2={cx + minuteLen * Math.cos(toRad(minuteAngle))}
          y2={cy + minuteLen * Math.sin(toRad(minuteAngle))}
          stroke={C.primary}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        <Circle cx={cx} cy={cy} r={4} fill={C.ink} />
      </Svg>
    </View>
  );
}

export default Clock;
