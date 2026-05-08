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

export function SubjectIcon({
  id,
  size = 18,
  color = "#1B1C1C",
  weight = "regular",
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
