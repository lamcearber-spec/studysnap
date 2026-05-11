import React from "react";
import { View, Text } from "react-native";
import { C, F } from "@/app/_components/tokens";
import { ExerciseVisual } from "@/context/SessionContext";
import { CubeArray } from "./CubeArray";
import { DotArray } from "./DotArray";
import { Fraction } from "./Fraction";
import { Clock } from "./Clock";
import { NumberLine } from "./NumberLine";
import { ShapeBasic } from "./ShapeBasic";
import { AreaGrid } from "./AreaGrid";
import { Money } from "./Money";
import { Scale } from "./Scale";
import { Thermometer } from "./Thermometer";
import { BarChart } from "./BarChart";
import { PieChart } from "./PieChart";
import { TallyMarks } from "./TallyMarks";
import { GeometricSolid } from "./GeometricSolid";
import { PatternSequence } from "./PatternSequence";

/**
 * VisualRenderer — dispatches a structured visual spec (from the AI) to the
 * matching SVG primitive component.
 *
 * All 15 primitives implemented:
 *   CubeArray, DotArray/TenFrame, Fraction, Clock, NumberLine, ShapeBasic,
 *   AreaGrid, Money, Scale, Thermometer, BarChart, PieChart, TallyMarks,
 *   GeometricSolid, PatternSequence.
 *
 * Unknown primitives render a small "missing visual" placeholder so the
 * exercise still works even when the AI returns an unrecognized name.
 */
export function VisualRenderer({ visual }: { visual: ExerciseVisual }) {
  const { primitive, props } = visual;

  switch (primitive) {
    case "CubeArray":
      return <CubeArray {...(props as React.ComponentProps<typeof CubeArray>)} />;
    case "DotArray":
    case "TenFrame":
      return <DotArray {...(props as React.ComponentProps<typeof DotArray>)} />;
    case "Fraction":
      return <Fraction {...(props as React.ComponentProps<typeof Fraction>)} />;
    case "Clock":
      return <Clock {...(props as React.ComponentProps<typeof Clock>)} />;
    case "NumberLine":
      return <NumberLine {...(props as React.ComponentProps<typeof NumberLine>)} />;
    case "ShapeBasic":
      return <ShapeBasic {...(props as React.ComponentProps<typeof ShapeBasic>)} />;
    case "AreaGrid":
      return <AreaGrid {...(props as React.ComponentProps<typeof AreaGrid>)} />;
    case "Money":
    case "Coins":
    case "Bills":
      return <Money {...(props as React.ComponentProps<typeof Money>)} />;
    case "Scale":
      return <Scale {...(props as React.ComponentProps<typeof Scale>)} />;
    case "Thermometer":
      return <Thermometer {...(props as React.ComponentProps<typeof Thermometer>)} />;
    case "BarChart":
      return <BarChart {...(props as React.ComponentProps<typeof BarChart>)} />;
    case "PieChart":
      return <PieChart {...(props as React.ComponentProps<typeof PieChart>)} />;
    case "TallyMarks":
      return <TallyMarks {...(props as React.ComponentProps<typeof TallyMarks>)} />;
    case "GeometricSolid":
      return <GeometricSolid {...(props as React.ComponentProps<typeof GeometricSolid>)} />;
    case "PatternSequence":
      return <PatternSequence {...(props as React.ComponentProps<typeof PatternSequence>)} />;
    default:
      return (
        <View
          style={{
            padding: 16,
            backgroundColor: C.surfaceLow,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.hairline,
            marginVertical: 8,
          }}
        >
          <Text style={{ fontFamily: F.bodyMedium, fontSize: 13, color: C.inkMuted, textAlign: "center" }}>
            ({primitive} — visual coming soon)
          </Text>
        </View>
      );
  }
}

export default VisualRenderer;
