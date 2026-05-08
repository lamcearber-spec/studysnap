// BaraBara take — palette + type tokens grounded in the market-research-driven
// "Duolingo structure with Khan-Kids warmth" recipe. Six colors, one job each.
// Reference: radom-vault/projects/designproject/barabara-market-research.md

export const C = {
  // SURFACES — cream-warm not blue-white. Reads "school-friendly" not "gym-app".
  surface: "#FAF3E7",          // Cream — primary background
  surfaceLow: "#F4ECDB",       // tonal step — subtle group separator
  surfaceHigh: "#EBE0C9",      // tonal step — slightly recessed surface
  card: "#FFFFFF",             // pure white for cards on cream

  // INK — warm slate, never pure black
  ink: "#3A3A3A",              // Slate — primary text
  inkBody: "#4D4D4D",          // body text
  inkMuted: "#8A8378",         // muted/secondary text on cream

  // BORDERS
  hairline: "#E5DDC9",         // hairline on cream surfaces

  // PRIMARY — Capybara Brown (the brand)
  primary: "#A76A4A",          // Capybara Brown
  primaryDark: "#8A5538",      // pressed / shadow tone
  primaryShadow: "#6B3F25",    // 3D button bottom-edge ledge
  primaryFixedDim: "#D6A98C",  // light primary tint
  primaryTint: "rgba(167,106,74,0.10)",
  primaryBorderTint: "rgba(167,106,74,0.30)",

  // ACCENT (Citrus / Honey) — streak / gold / "look-here"
  yellow: "#FFB627",           // Citrus
  yellowDeep: "#A66C00",       // text-safe yellow
  yellowSoft: "#FFE4A8",       // light citrus tint
  yellowTint: "rgba(255,182,39,0.16)",

  // SUCCESS (Sage) — correct / positive
  success: "#7BB37A",
  successDark: "#5C9659",

  // ERROR / HEART-LOSS (Cardinal) — wrong / destructive (less neon than Duo's #FF4B4B)
  error: "#E0533D",
  errorDark: "#B03A26",
};

// FONTS — Epilogue (rounded heavy display, Feather-Bold-equivalent) + Inter
// (clean rounded body). Both already loaded in app/_layout.tsx — no new deps.
export const F = {
  display: "Epilogue_700Bold",
  displaySemi: "Epilogue_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
};

export default {};
