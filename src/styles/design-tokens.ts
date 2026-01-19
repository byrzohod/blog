/**
 * Design Tokens for Book of Life Blog
 *
 * Core principle: Matrix Terminal Theme
 * - Deep charcoal background with phosphor green accents
 * - Eye comfort with no harsh contrasts
 * - Subtle scanline and glow aesthetics
 */

export const colors = {
  // Matrix Terminal Palette (only theme)
  background: {
    DEFAULT: "#0C1114",
    subtle: "#10181A",
    muted: "#162224",
  },
  foreground: {
    DEFAULT: "#DCE9E1",
    muted: "#A0B5AA",
    subtle: "#6D8579",
  },
  accent: {
    DEFAULT: "#2FE26C",
    hover: "#52F28C",
    muted: "#1F3A2A",
  },
  accentCyan: {
    DEFAULT: "#1CA78E",
    hover: "#2BC9A8",
    muted: "#15332B",
  },
  border: "#243134",
  card: "#10181A",
  cardHover: "#162224",
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",

  // Gradient colors
  gradient: {
    start: "#2FE26C",
    end: "#1CA78E",
  },

  // Glow colors (with opacity)
  glow: {
    green: "rgba(47, 226, 108, 0.3)",
    teal: "rgba(28, 167, 142, 0.2)",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
    serif: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
    mono: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    "5xl": ["3rem", { lineHeight: "1.2" }],
  },
} as const;

export const spacing = {
  px: "1px",
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const borderRadius = {
  none: "0",
  sm: "0.125rem",
  DEFAULT: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px",
} as const;

// CSS custom properties in HSL format for Matrix Terminal theme
export const cssVariables = {
  // Main colors
  "--background": "210 24% 6%",
  "--background-subtle": "210 22% 9%",
  "--background-muted": "210 20% 13%",
  "--foreground": "130 20% 88%",
  "--foreground-muted": "130 10% 65%",
  "--foreground-subtle": "130 8% 45%",

  // Matrix accent
  "--accent": "142 78% 52%",
  "--accent-hover": "142 78% 62%",
  "--accent-muted": "150 30% 18%",

  // Teal accent
  "--accent-cyan": "174 70% 40%",
  "--accent-cyan-hover": "174 70% 48%",
  "--accent-cyan-muted": "174 30% 18%",

  // Gradient
  "--gradient-start": "142 78% 52%",
  "--gradient-end": "174 70% 40%",

  // Glow
  "--glow-green": "142 78% 52%",
  "--glow-teal": "174 70% 40%",

  // Other
  "--border": "210 16% 22%",
  "--card": "210 22% 9%",
  "--card-hover": "210 20% 13%",
  "--success": "142 71% 55%",
  "--warning": "48 96% 53%",
  "--error": "0 84% 60%",
  "--radius": "0.5rem",
} as const;

export type ColorTheme = typeof colors;
