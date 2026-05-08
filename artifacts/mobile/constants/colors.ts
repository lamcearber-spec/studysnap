// BaraBara design tokens — exposed via the legacy useColors() hook so every
// screen that still consumes `colors.background`, `colors.primary` etc.
// automatically picks up the Modern Schoolyard aesthetic without per-screen
// rewrites. Field names are kept identical to the original scaffold so no
// call-sites need updating. The canonical token source remains
// `app/_components/tokens.ts` (C + F) for screens that opt in to the strict
// Modern Schoolyard component vocabulary.

const colors = {
  light: {
    text: "#1B1C1C",
    tint: "#2D5A27",

    background: "#FAF9F6",
    foreground: "#1B1C1C",

    card: "#FFFFFF",
    cardForeground: "#1B1C1C",

    primary: "#2D5A27",
    primaryForeground: "#FFFFFF",

    secondary: "#F4F1ED",
    secondaryForeground: "#154212",

    muted: "#F4F1ED",
    mutedForeground: "#72796E",

    accent: "#F7D060",
    accentForeground: "#745B00",

    destructive: "#BA1A1A",
    destructiveForeground: "#FFFFFF",

    border: "#C2C9BB",
    input: "#C2C9BB",

    success: "#2D5A27",
    successForeground: "#FFFFFF",

    // Subject colors — warm earthen palette aligned with the brand.
    math: "#2D5A27",
    science: "#1F6E7A",
    english: "#745B00",
    history: "#8B1A1A",
    art: "#7B1F2A",
    other: "#72796E",
  },

  dark: {
    text: "#E8E4D9",
    tint: "#A1D494",

    background: "#16130C",
    foreground: "#E8E4D9",

    card: "#221E18",
    cardForeground: "#E8E4D9",

    primary: "#A1D494",
    primaryForeground: "#16130C",

    secondary: "#2A2620",
    secondaryForeground: "#A1D494",

    muted: "#2A2620",
    mutedForeground: "#9A938A",

    accent: "#F7D060",
    accentForeground: "#16130C",

    destructive: "#FFB4AB",
    destructiveForeground: "#16130C",

    border: "#3D362F",
    input: "#3D362F",

    success: "#A1D494",
    successForeground: "#16130C",

    math: "#A1D494",
    science: "#8BD2DF",
    english: "#F5BE44",
    history: "#FFB3AC",
    art: "#FFB3AC",
    other: "#9A938A",
  },

  radius: 12,
};

export default colors;
