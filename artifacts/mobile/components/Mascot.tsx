import React from "react";
import { Image } from "expo-image";

const ICON_SOURCE = require("../assets/mascot/icon.png");
const POSE_SOURCE = require("../assets/mascot/onboarding-pose.png");

export type MascotVariant = "icon" | "pose";

export function Mascot({
  variant = "icon",
  size = 32,
}: {
  variant?: MascotVariant;
  size?: number;
}) {
  const source = variant === "pose" ? POSE_SOURCE : ICON_SOURCE;
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      contentFit="contain"
      transition={200}
      accessibilityLabel="MarmotMakesMath marmot mascot"
    />
  );
}

export default Mascot;
