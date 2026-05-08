import React from "react";
import { Plant, Seedling, Tree } from "phosphor-react-native";

import { getDifficultyIconName } from "@/constants/data";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; weight?: "regular" | "bold" | "light" | "thin" | "fill" | "duotone" }>> = {
  Seedling,
  Plant,
  Tree,
};

// BaraBara default — duotone weight matches the SubjectIcon family.
export function DifficultyIcon({
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
  const Icon = ICON_MAP[getDifficultyIconName(id)] ?? Plant;
  return <Icon size={size} color={color} weight={weight} />;
}

export default DifficultyIcon;
