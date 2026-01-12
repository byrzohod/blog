/**
 * Design Tokens for Book of Life Blog
 *
 * Core principle: Sci-Fi Dark Theme
 * - Deep space aesthetic with purple/cyan gradients
 * - Eye comfort with no harsh contrasts
 * - Subtle glow effects and modern aesthetics
 */

export const colors = {
  // Sci-Fi Dark Palette (only theme)
  background: {
    DEFAULT: '#0A0A0F', // Deep space black
    subtle: '#12121A', // Midnight blue-black
    muted: '#1A1A24', // Dark purple-tinted
  },
  foreground: {
    DEFAULT: '#FAFAFA', // Crisp white
    muted: '#B3B3B3', // Light gray
    subtle: '#808080', // Medium gray
  },
  accent: {
    DEFAULT: '#8B5CF6', // Purple
    hover: '#A78BFA', // Lighter purple
    muted: '#3B2667', // Dark purple
  },
  accentCyan: {
    DEFAULT: '#06B6D4', // Cyan
    hover: '#22D3EE', // Lighter cyan
    muted: '#164E63', // Dark cyan
  },
  border: '#1E1E2E', // Purple-tinted border
  card: '#12121A', // Card background
  cardHover: '#1A1A24', // Card hover
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',

  // Gradient colors
  gradient: {
    start: '#8B5CF6', // Purple
    end: '#06B6D4', // Cyan
  },

  // Glow colors (with opacity)
  glow: {
    purple: 'rgba(139, 92, 246, 0.3)',
    cyan: 'rgba(6, 182, 212, 0.2)',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    serif: ['Georgia', 'Cambria', 'serif'],
    mono: ['JetBrains Mono', 'Menlo', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1.2' }],
  },
} as const;

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
} as const;

// CSS custom properties in HSL format for Sci-Fi Dark theme
export const cssVariables = {
  // Main colors
  '--background': '240 10% 4%',
  '--background-subtle': '240 15% 8%',
  '--background-muted': '240 12% 12%',
  '--foreground': '0 0% 98%',
  '--foreground-muted': '0 0% 70%',
  '--foreground-subtle': '0 0% 50%',

  // Purple accent (primary)
  '--accent': '258 89% 66%',
  '--accent-hover': '258 89% 76%',
  '--accent-muted': '258 50% 20%',

  // Cyan accent (secondary)
  '--accent-cyan': '187 94% 43%',
  '--accent-cyan-hover': '187 94% 53%',
  '--accent-cyan-muted': '187 50% 20%',

  // Gradient
  '--gradient-start': '258 89% 66%',
  '--gradient-end': '187 94% 43%',

  // Glow
  '--glow-purple': '258 89% 66%',
  '--glow-cyan': '187 94% 43%',

  // Other
  '--border': '240 10% 18%',
  '--card': '240 15% 8%',
  '--card-hover': '240 12% 12%',
  '--success': '142 71% 55%',
  '--warning': '48 96% 53%',
  '--error': '0 84% 60%',
  '--radius': '0.5rem',
} as const;

export type ColorTheme = typeof colors;
