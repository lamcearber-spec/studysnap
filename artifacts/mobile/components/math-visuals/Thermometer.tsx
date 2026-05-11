import React from "react";
import { View } from "react-native";
import Svg, { Rect, Circle, Line, Text as SvgText } from "react-native-svg";
import { C, F } from "@/app/_components/tokens";

/**
 * Thermometer — vertical thermometer with min/max + reading.
 * AI returns: { reading: 22, min: -10, max: 40, unit: "C" | "F" }
 */
export type ThermometerProps = {
  reading: number;
  min?: number;
  max?: number;
  unit?: "C" | "F";
  size?: number;
};

export function Thermometer({
  reading,
  min = -10,
  max = 40,
  unit = "C",
  size = 200,
}: ThermometerProps) {
  const width = size * 0.4;
  const height = size;
  const tubeW = width * 0.3;
  const tubeX = width / 2 - tubeW / 2;
  const tubeTop = height * 0.08;
  const tubeBottom = height * 0.85;
  const bulbCY = tubeBottom + tubeW * 1.1;
  const bulbR = tubeW * 1.3;

  const clamped = Math.max(min, Math.min(max, reading));
  const t = (clamped - min) / (max - min);
  const fillY = tubeBottom - t * (tubeBottom - tubeTop);

  // Tick marks at min, mid, max
  const ticks = [min, Math.round((min + max) / 2), max];

  return (
    <View style={{ alignItems: "center", padding: 12 }}>
      <Svg width={width + 50} height={height + bulbR} viewBox={`0 0 ${width + 50} ${height + bulbR}`}>
        {/* Tube outline */}
        <Rect
          x={tubeX}
          y={tubeTop}
          width={tubeW}
          height={tubeBottom - tubeTop}
          rx={tubeW / 2}
          fill={C.surface}
          stroke={C.ink}
          strokeWidth={2}
        />
        {/* Mercury fill */}
        <Rect
          x={tubeX + 2}
          y={fillY}
          width={tubeW - 4}
          height={tubeBottom - fillY}
          fill={C.error}
        />
        {/* Bulb */}
        <Circle cx={width / 2} cy={bulbCY} r={bulbR} fill={C.error} stroke={C.ink} strokeWidth={2} />
        {/* Tick marks */}
        {ticks.map((tick, i) => {
          const ty = tubeBottom - ((tick - min) / (max - min)) * (tubeBottom - tubeTop);
          return (
            <React.Fragment key={i}>
              <Line
                x1={tubeX + tubeW}
                y1={ty}
                x2={tubeX + tubeW + 6}
                y2={ty}
                stroke={C.ink}
                strokeWidth={1.5}
              />
              <SvgText
                x={tubeX + tubeW + 9}
                y={ty + 4}
                fontFamily={F.bodyMedium}
                fontSize={11}
                fill={C.inkBody}
              >
                {tick}°
              </SvgText>
            </React.Fragment>
          );
        })}
        {/* Reading */}
        <SvgText
          x={width / 2}
          y={height + bulbR * 0.4}
          fontFamily={F.bodyBold}
          fontSize={14}
          fill={C.ink}
          textAnchor="middle"
        >
          {reading}°{unit}
        </SvgText>
      </Svg>
    </View>
  );
}

export default Thermometer;
