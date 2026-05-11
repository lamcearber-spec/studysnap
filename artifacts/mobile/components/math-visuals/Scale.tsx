import React from "react";
import { View } from "react-native";
import Svg, { Line, Rect, Polygon, Circle, Text as SvgText } from "react-native-svg";
import { C, F } from "@/app/_components/tokens";

/**
 * Scale — balance scale comparing two sides.
 * AI returns:
 *   { leftLabel: "5", rightLabel: "?", tilt: "left" | "right" | "balanced" }
 *   or { leftWeight: 3, rightWeight: 5 } and we derive tilt.
 */
export type ScaleProps = {
  leftLabel?: string;
  rightLabel?: string;
  leftWeight?: number;
  rightWeight?: number;
  tilt?: "left" | "right" | "balanced";
  size?: number;
};

export function Scale({
  leftLabel,
  rightLabel,
  leftWeight,
  rightWeight,
  tilt,
  size = 180,
}: ScaleProps) {
  const resolvedTilt: "left" | "right" | "balanced" =
    tilt ??
    (leftWeight !== undefined && rightWeight !== undefined
      ? leftWeight === rightWeight
        ? "balanced"
        : leftWeight > rightWeight
          ? "left"
          : "right"
      : "balanced");

  const lLabel = leftLabel ?? (leftWeight !== undefined ? String(leftWeight) : "");
  const rLabel = rightLabel ?? (rightWeight !== undefined ? String(rightWeight) : "");

  const cx = size / 2;
  const beamY = size * 0.35;
  const beamLen = size * 0.7;
  const dy = resolvedTilt === "balanced" ? 0 : size * 0.06;
  const leftY = resolvedTilt === "left" ? beamY + dy : beamY - dy;
  const rightY = resolvedTilt === "right" ? beamY + dy : beamY - dy;
  const panR = size * 0.13;
  const pivotY = size * 0.78;
  const panLeftX = cx - beamLen / 2;
  const panRightX = cx + beamLen / 2;

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Base */}
        <Rect x={cx - size * 0.18} y={pivotY + size * 0.06} width={size * 0.36} height={size * 0.05} fill={C.ink} rx={2} />
        {/* Pillar */}
        <Polygon
          points={`${cx - size * 0.04},${pivotY + size * 0.06} ${cx + size * 0.04},${pivotY + size * 0.06} ${cx + size * 0.02},${beamY} ${cx - size * 0.02},${beamY}`}
          fill={C.ink}
        />
        {/* Beam */}
        <Line
          x1={panLeftX}
          y1={leftY}
          x2={panRightX}
          y2={rightY}
          stroke={C.ink}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* Pivot */}
        <Circle cx={cx} cy={beamY} r={size * 0.025} fill={C.primaryDark} />
        {/* Left pan */}
        <Line x1={panLeftX} y1={leftY} x2={panLeftX} y2={leftY + size * 0.1} stroke={C.ink} strokeWidth={1.5} />
        <Polygon
          points={`${panLeftX - panR},${leftY + size * 0.1} ${panLeftX + panR},${leftY + size * 0.1} ${panLeftX + panR * 0.7},${leftY + size * 0.18} ${panLeftX - panR * 0.7},${leftY + size * 0.18}`}
          fill={C.primaryFixedDim}
          stroke={C.primaryDark}
          strokeWidth={1.5}
        />
        <SvgText
          x={panLeftX}
          y={leftY + size * 0.14}
          fontFamily={F.bodyBold}
          fontSize={size * 0.1}
          fill={C.ink}
          textAnchor="middle"
        >
          {lLabel}
        </SvgText>
        {/* Right pan */}
        <Line x1={panRightX} y1={rightY} x2={panRightX} y2={rightY + size * 0.1} stroke={C.ink} strokeWidth={1.5} />
        <Polygon
          points={`${panRightX - panR},${rightY + size * 0.1} ${panRightX + panR},${rightY + size * 0.1} ${panRightX + panR * 0.7},${rightY + size * 0.18} ${panRightX - panR * 0.7},${rightY + size * 0.18}`}
          fill={C.primaryFixedDim}
          stroke={C.primaryDark}
          strokeWidth={1.5}
        />
        <SvgText
          x={panRightX}
          y={rightY + size * 0.14}
          fontFamily={F.bodyBold}
          fontSize={size * 0.1}
          fill={C.ink}
          textAnchor="middle"
        >
          {rLabel}
        </SvgText>
      </Svg>
    </View>
  );
}

export default Scale;
