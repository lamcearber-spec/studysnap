import React from "react";
import { View } from "react-native";
import Svg, { Polygon, Circle, Rect } from "react-native-svg";
import { C } from "@/app/_components/tokens";

/**
 * ShapeBasic — primary 2D geometry shapes.
 * AI returns: { type: "triangle" | "square" | "rectangle" | "circle" | "pentagon" | "hexagon", size: 80 }
 */
export type ShapeBasicProps = {
  type: "triangle" | "square" | "rectangle" | "circle" | "pentagon" | "hexagon";
  size?: number;
  filled?: boolean;
};

function regularPolygon(sides: number, cx: number, cy: number, r: number) {
  const offsetAngle = -Math.PI / 2; // start at top
  return Array.from({ length: sides }, (_, i) => {
    const angle = offsetAngle + (i * 2 * Math.PI) / sides;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
}

export function ShapeBasic({ type, size = 100, filled = false }: ShapeBasicProps) {
  const pad = 8;
  const canvas = size + pad * 2;
  const cx = canvas / 2;
  const cy = canvas / 2;
  const r = size / 2;
  const fill = filled ? C.primaryFixedDim : "none";
  const stroke = C.ink;
  const strokeWidth = 3;

  let element: React.ReactNode = null;
  switch (type) {
    case "triangle":
      element = <Polygon points={regularPolygon(3, cx, cy, r)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
      break;
    case "square":
      element = <Rect x={pad} y={pad} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case "rectangle":
      element = <Rect x={pad} y={pad + size * 0.15} width={size} height={size * 0.7} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case "circle":
      element = <Circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case "pentagon":
      element = <Polygon points={regularPolygon(5, cx, cy, r)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
      break;
    case "hexagon":
      element = <Polygon points={regularPolygon(6, cx, cy, r)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
      break;
  }

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={canvas} height={canvas} viewBox={`0 0 ${canvas} ${canvas}`}>
        {element}
      </Svg>
    </View>
  );
}

export default ShapeBasic;
