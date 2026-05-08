import React from "react";
import {
  Bank,
  BookOpen,
  Code,
  Flask,
  Globe,
  MathOperations,
  MusicNote,
  Palette,
  Plant,
  SoccerBall,
  TestTube,
  UsersThree,
} from "phosphor-react-native";

import { getSubjectIconName } from "@/constants/data";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; weight?: "regular" | "bold" | "light" | "thin" | "fill" | "duotone" }>> = {
  MathOperations,
  BookOpen,
  Flask,
  Bank,
  Globe,
  Palette,
  MusicNote,
  Code,
  SoccerBall,
  UsersThree,
  Plant,
  TestTube,
};

// BaraBara default — duotone weight gives Phosphor icons the "3D fat" feeling
// the market winners (Duolingo, Khan Kids) achieve via custom illustration,
// without the illustration cost. Override per-call only when the surface
// genuinely calls for a thinner/heavier mark.
export function SubjectIcon({
  id,
  size = 18,
  color = "#3A3A3A",
  weight = "duotone",
}: {
  id: string;
  size?: number;
  color?: string;
  weight?: "regular" | "bold" | "light" | "thin" | "fill" | "duotone";
}) {
  const Icon = ICON_MAP[getSubjectIconName(id)] ?? BookOpen;
  return <Icon size={size} color={color} weight={weight} />;
}

export default SubjectIcon;
