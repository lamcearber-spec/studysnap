// BaraBara take design tokens — exposed via the legacy useColors() hook so
// every screen that consumes `colors.background`, `colors.primary` etc.
// auto-adopts the new palette. Mirrors `app/_components/tokens.ts` (C).
// Reference: radom-vault/projects/designproject/barabara-market-research.md

const colors = {
  light: {
    // Core
    text: "#3A3A3A",             // Slate
    tint: "#A76A4A",             // Capybara Brown

    // Surfaces
    background: "#FAF3E7",        // Cream — primary background
    foreground: "#3A3A3A",        // Slate

    card: "#FFFFFF",
    cardForeground: "#3A3A3A",

    // Primary (Capybara Brown)
    primary: "#A76A4A",
    primaryForeground: "#FFFFFF",

    // Secondary surface (cream tonal step)
    secondary: "#F4ECDB",
    secondaryForeground: "#8A5538",

    // Muted
    muted: "#F4ECDB",
    mutedForeground: "#8A8378",

    // Accent (Citrus — streak / gold)
    accent: "#FFB627",
    accentForeground: "#A66C00",

    // Destructive (Cardinal — wrong / heart-loss)
    destructive: "#E0533D",
    destructiveForeground: "#FFFFFF",

    // Borders
    border: "#E5DDC9",
    input: "#E5DDC9",

    // Success (Sage)
    success: "#7BB37A",
    successForeground: "#FFFFFF",

    // Subject colors — selected from the BaraBara 6-color palette so subject
    // accents never escape the brand. Each subject gets one warm shade.
    math: "#A76A4A",       // Capybara Brown
    science: "#7BB37A",    // Sage
    english: "#FFB627",    // Citrus
    history: "#E0533D",    // Cardinal
    art: "#8A5538",        // Capybara Dark
    other: "#8A8378",      // Ink Muted
  },

  dark: {
    text: "#FAF3E7",
    tint: "#D6A98C",

    background: "#1F1812",         // warm near-black with brown undertone
    foreground: "#FAF3E7",

    card: "#2A211A",
    cardForeground: "#FAF3E7",

    primary: "#D6A98C",            // light Capybara for dark mode
    primaryForeground: "#1F1812",

    secondary: "#3A2E25",
    secondaryForeground: "#D6A98C",

    muted: "#3A2E25",
    mutedForeground: "#B5A893",

    accent: "#FFB627",
    accentForeground: "#1F1812",

    destructive: "#FFB4AB",
    destructiveForeground: "#1F1812",

    border: "#4D3F33",
    input: "#4D3F33",

    success: "#A4D4A2",
    successForeground: "#1F1812",

    math: "#D6A98C",
    science: "#A4D4A2",
    english: "#FFB627",
    history: "#FFB4AB",
    art: "#D6A98C",
    other: "#B5A893",
  },

  radius: 14, // Duolingo-leaning rounded radius
};

export default colors;
