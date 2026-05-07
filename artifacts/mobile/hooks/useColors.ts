import { useAppearance } from "@/context/AppearanceContext";
import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 *
 * Reads the user's appearance preference from AppearanceContext
 * ("system" | "light" | "dark") and resolves it to the correct palette.
 */
export function useColors() {
  const { effectiveScheme } = useAppearance();
  const palette =
    effectiveScheme === "dark"
      ? colors.dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
