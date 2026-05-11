import React from "react";
import { View } from "react-native";
import Svg, { Polygon, Ellipse, Path, Line } from "react-native-svg";
import { C } from "@/app/_components/tokens";

/**
 * GeometricSolid — isometric 3D shape primitive.
 * AI returns: { shape: "cube" | "sphere" | "cylinder" | "cone" | "rectangular-prism" | "triangular-prism" }
 */
export type GeometricSolidProps = {
  shape: "cube" | "sphere" | "cylinder" | "cone" | "rectangular-prism" | "triangular-prism";
  size?: number;
};

export function GeometricSolid({ shape, size = 120 }: GeometricSolidProps) {
  const s = size;
  const fill = C.primary;
  const top = C.primaryFixedDim;
  const side = C.primaryDark;
  const stroke = C.ink;

  function renderShape() {
    switch (shape) {
      case "cube": {
        const off = s * 0.18;
        const front = `${s * 0.15},${s * 0.35} ${s * 0.65},${s * 0.35} ${s * 0.65},${s * 0.85} ${s * 0.15},${s * 0.85}`;
        const topF = `${s * 0.15},${s * 0.35} ${s * 0.15 + off},${s * 0.35 - off} ${s * 0.65 + off},${s * 0.35 - off} ${s * 0.65},${s * 0.35}`;
        const sideF = `${s * 0.65},${s * 0.35} ${s * 0.65 + off},${s * 0.35 - off} ${s * 0.65 + off},${s * 0.85 - off} ${s * 0.65},${s * 0.85}`;
        return (
          <>
            <Polygon points={front} fill={fill} stroke={stroke} strokeWidth={1.5} />
            <Polygon points={topF} fill={top} stroke={stroke} strokeWidth={1.5} />
            <Polygon points={sideF} fill={side} stroke={stroke} strokeWidth={1.5} />
          </>
        );
      }
      case "sphere": {
        return (
          <>
            <Ellipse cx={s / 2} cy={s / 2} rx={s * 0.35} ry={s * 0.35} fill={fill} stroke={stroke} strokeWidth={1.5} />
            <Ellipse cx={s * 0.42} cy={s * 0.42} rx={s * 0.1} ry={s * 0.08} fill={top} opacity={0.7} />
          </>
        );
      }
      case "cylinder": {
        const ry = s * 0.08;
        return (
          <>
            <Path
              d={`M ${s * 0.2} ${s * 0.25} A ${s * 0.3} ${ry} 0 0 0 ${s * 0.8} ${s * 0.25} L ${s * 0.8} ${s * 0.75} A ${s * 0.3} ${ry} 0 0 1 ${s * 0.2} ${s * 0.75} Z`}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.5}
            />
            <Ellipse cx={s / 2} cy={s * 0.25} rx={s * 0.3} ry={ry} fill={top} stroke={stroke} strokeWidth={1.5} />
          </>
        );
      }
      case "cone": {
        return (
          <>
            <Path
              d={`M ${s / 2} ${s * 0.15} L ${s * 0.85} ${s * 0.78} A ${s * 0.35} ${s * 0.08} 0 0 1 ${s * 0.15} ${s * 0.78} Z`}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.5}
            />
            <Ellipse cx={s / 2} cy={s * 0.78} rx={s * 0.35} ry={s * 0.08} fill={side} stroke={stroke} strokeWidth={1.5} />
          </>
        );
      }
      case "rectangular-prism": {
        const off = s * 0.18;
        const front = `${s * 0.12},${s * 0.45} ${s * 0.62},${s * 0.45} ${s * 0.62},${s * 0.8} ${s * 0.12},${s * 0.8}`;
        const topF = `${s * 0.12},${s * 0.45} ${s * 0.12 + off},${s * 0.45 - off} ${s * 0.62 + off},${s * 0.45 - off} ${s * 0.62},${s * 0.45}`;
        const sideF = `${s * 0.62},${s * 0.45} ${s * 0.62 + off},${s * 0.45 - off} ${s * 0.62 + off},${s * 0.8 - off} ${s * 0.62},${s * 0.8}`;
        return (
          <>
            <Polygon points={front} fill={fill} stroke={stroke} strokeWidth={1.5} />
            <Polygon points={topF} fill={top} stroke={stroke} strokeWidth={1.5} />
            <Polygon points={sideF} fill={side} stroke={stroke} strokeWidth={1.5} />
          </>
        );
      }
      case "triangular-prism": {
        const off = s * 0.18;
        const front = `${s * 0.15},${s * 0.8} ${s * 0.65},${s * 0.8} ${s * 0.4},${s * 0.25}`;
        const back = `${s * 0.15 + off},${s * 0.8 - off} ${s * 0.65 + off},${s * 0.8 - off} ${s * 0.4 + off},${s * 0.25 - off}`;
        const sideBottom = `${s * 0.65},${s * 0.8} ${s * 0.65 + off},${s * 0.8 - off} ${s * 0.4 + off},${s * 0.25 - off} ${s * 0.4},${s * 0.25}`;
        return (
          <>
            <Polygon points={back} fill={top} stroke={stroke} strokeWidth={1.5} />
            <Polygon points={sideBottom} fill={side} stroke={stroke} strokeWidth={1.5} />
            <Polygon points={front} fill={fill} stroke={stroke} strokeWidth={1.5} />
            <Line x1={s * 0.15} y1={s * 0.8} x2={s * 0.15 + off} y2={s * 0.8 - off} stroke={stroke} strokeWidth={1.5} />
          </>
        );
      }
    }
  }

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        {renderShape()}
      </Svg>
    </View>
  );
}

export default GeometricSolid;
