# Phase 0: Design System Implementation

**Status:** Not Started
**Priority:** High (Foundation for all UI work)
**Dependencies:** None
**Estimated Tasks:** 8

---

## Overview

Implement the centralized design system that ensures consistent, eye-comfortable styling across the entire application. This phase establishes the color tokens, typography, spacing, and component patterns that all other phases will use.

---

## Goals

1. Create a single source of truth for all design tokens
2. Ensure eye comfort with warm, non-harsh colors
3. Support both light and dark modes
4. Integrate seamlessly with Tailwind CSS and shadcn/ui
5. Make theming easy to maintain and update

---

## Tasks

### 0.1 Create Design Tokens File

**File:** `src/styles/design-tokens.ts`

Create TypeScript file with all color, spacing, and typography definitions.

```typescript
// src/styles/design-tokens.ts

export const colors = {
  light: {
    background: {
      DEFAULT: '#FAF9F7',
      subtle: '#F5F4F0',
      muted: '#EFEEE8',
    },
    foreground: {
      DEFAULT: '#1A1A1A',
      muted: '#6B6B6B',
      subtle: '#9A9A9A',
    },
    accent: {
      DEFAULT: '#2563EB',
      hover: '#1D4ED8',
      muted: '#DBEAFE',
    },
    border: '#E5E4DF',
    success: '#16A34A',
    warning: '#CA8A04',
    error: '#DC2626',
  },
  dark: {
    background: {
      DEFAULT: '#1C1C1E',
      subtle: '#2C2C2E',
      muted: '#3A3A3C',
    },
    foreground: {
      DEFAULT: '#F5F5F5',
      muted: '#A1A1A1',
      subtle: '#6B6B6B',
    },
    accent: {
      DEFAULT: '#60A5FA',
      hover: '#93C5FD',
      muted: '#1E3A5F',
    },
    border: '#3A3A3C',
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    serif: ['Georgia', 'serif'],
    mono: ['JetBrains Mono', 'monospace'],
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
```

**Acceptance Criteria:**
- [ ] File exports colors, typography, spacing, borderRadius
- [ ] Light and dark mode colors defined
- [ ] TypeScript types are properly inferred
- [ ] No pure white (#FFFFFF) or pure black (#000000)

---

### 0.2 Configure Tailwind Theme

**File:** `tailwind.config.ts`

Extend Tailwind with custom theme using design tokens.

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import { colors, typography, spacing, borderRadius } from './src/styles/design-tokens';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'hsl(var(--background))',
          subtle: 'hsl(var(--background-subtle))',
          muted: 'hsl(var(--background-muted))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          muted: 'hsl(var(--foreground-muted))',
          subtle: 'hsl(var(--foreground-subtle))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          hover: 'hsl(var(--accent-hover))',
          muted: 'hsl(var(--accent-muted))',
        },
        border: 'hsl(var(--border))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        error: 'hsl(var(--error))',
      },
      fontFamily: typography.fontFamily,
      borderRadius: borderRadius,
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

**Acceptance Criteria:**
- [ ] Custom colors available as Tailwind classes
- [ ] Dark mode uses `class` strategy
- [ ] Typography plugin configured for prose content
- [ ] All design tokens accessible via Tailwind

---

### 0.3 Set Up CSS Custom Properties

**File:** `src/app/globals.css`

Define CSS custom properties that can be toggled for dark mode.

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode (default) */
    --background: 40 20% 97%;
    --background-subtle: 40 14% 95%;
    --background-muted: 40 12% 92%;

    --foreground: 0 0% 10%;
    --foreground-muted: 0 0% 42%;
    --foreground-subtle: 0 0% 60%;

    --accent: 221 83% 53%;
    --accent-hover: 221 83% 47%;
    --accent-muted: 214 95% 93%;

    --border: 40 10% 89%;

    --success: 142 71% 45%;
    --warning: 45 93% 47%;
    --error: 0 72% 51%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 240 6% 12%;
    --background-subtle: 240 5% 17%;
    --background-muted: 240 4% 22%;

    --foreground: 0 0% 96%;
    --foreground-muted: 0 0% 63%;
    --foreground-subtle: 0 0% 42%;

    --accent: 213 94% 68%;
    --accent-hover: 213 97% 78%;
    --accent-muted: 215 50% 23%;

    --border: 240 4% 22%;

    --success: 142 71% 55%;
    --warning: 48 96% 53%;
    --error: 0 84% 60%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Typography for blog content */
.prose {
  --tw-prose-body: hsl(var(--foreground));
  --tw-prose-headings: hsl(var(--foreground));
  --tw-prose-links: hsl(var(--accent));
  --tw-prose-bold: hsl(var(--foreground));
  --tw-prose-quotes: hsl(var(--foreground-muted));
  --tw-prose-code: hsl(var(--foreground));
  --tw-prose-pre-bg: hsl(var(--background-subtle));
}
```

**Acceptance Criteria:**
- [ ] CSS custom properties defined for all tokens
- [ ] HSL format for flexibility
- [ ] Dark mode overrides with `.dark` class
- [ ] Prose styles use custom properties

---

### 0.4 Create Dark Mode Toggle

**File:** `src/components/theme-provider.tsx` and `src/components/theme-toggle.tsx`

Implement theme switching with system preference support.

```typescript
// src/components/theme-provider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

```typescript
// src/components/theme-toggle.tsx
'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

**Dependencies:** `next-themes`, `lucide-react`

**Acceptance Criteria:**
- [ ] Theme persists across page loads
- [ ] Respects system preference by default
- [ ] Smooth transition between themes
- [ ] No flash of wrong theme on load

---

### 0.5 Configure shadcn/ui Theme

Update shadcn/ui components to use custom theme.

**Steps:**
1. Run `npx shadcn@latest init`
2. Choose CSS variables approach
3. Update generated CSS to match our tokens
4. Install core components: Button, Input, Card, etc.

**Acceptance Criteria:**
- [ ] shadcn/ui installed and configured
- [ ] Components use custom color tokens
- [ ] Dark mode works with all components
- [ ] No hardcoded colors in components

---

### 0.6 Create Typography Styles

**File:** `src/styles/typography.css` (imported in globals.css)

Define typography styles for blog content.

```css
/* Reading-optimized typography */
.blog-content {
  @apply text-lg leading-relaxed;
  max-width: 65ch;
}

.blog-content h1 {
  @apply text-4xl font-bold mt-12 mb-6;
}

.blog-content h2 {
  @apply text-3xl font-semibold mt-10 mb-4;
}

.blog-content h3 {
  @apply text-2xl font-semibold mt-8 mb-3;
}

.blog-content p {
  @apply mb-6;
}

.blog-content a {
  @apply text-accent hover:text-accent-hover underline underline-offset-2;
}

.blog-content blockquote {
  @apply border-l-4 border-accent pl-6 italic text-foreground-muted my-6;
}

.blog-content code {
  @apply bg-background-muted px-1.5 py-0.5 rounded text-sm font-mono;
}

.blog-content pre {
  @apply bg-background-subtle p-4 rounded-lg overflow-x-auto my-6;
}

.blog-content ul, .blog-content ol {
  @apply mb-6 pl-6;
}

.blog-content li {
  @apply mb-2;
}
```

**Acceptance Criteria:**
- [ ] Optimal line length (65ch max)
- [ ] Comfortable line height (1.6-1.8)
- [ ] Clear heading hierarchy
- [ ] Code blocks styled appropriately

---

### 0.7 Create Spacing Utilities

Document and implement consistent spacing patterns.

**File:** `src/styles/spacing.css`

```css
/* Section spacing */
.section {
  @apply py-16 md:py-24;
}

.section-sm {
  @apply py-8 md:py-12;
}

/* Container */
.container-prose {
  @apply max-w-prose mx-auto px-4;
}

.container-wide {
  @apply max-w-6xl mx-auto px-4 md:px-8;
}

/* Card spacing */
.card-padding {
  @apply p-6;
}

/* Form spacing */
.form-group {
  @apply space-y-2;
}

.form-stack {
  @apply space-y-6;
}
```

**Acceptance Criteria:**
- [ ] Consistent spacing across all pages
- [ ] Responsive spacing adjustments
- [ ] Documented utility classes

---

### 0.8 Document Component Patterns

**File:** `docs/implementation/component-patterns.md`

Create reference documentation for common component patterns.

**Contents:**
- Card patterns (blog post card, feature card)
- Button variants and usage
- Form patterns
- Navigation patterns
- Modal/dialog patterns

**Acceptance Criteria:**
- [ ] Each pattern has code example
- [ ] Accessibility notes included
- [ ] Dark mode considerations documented

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/styles/design-tokens.ts` | Create | Color and spacing definitions |
| `tailwind.config.ts` | Modify | Extend with custom theme |
| `src/app/globals.css` | Modify | CSS custom properties |
| `src/components/theme-provider.tsx` | Create | Theme context provider |
| `src/components/theme-toggle.tsx` | Create | Dark mode toggle button |
| `src/styles/typography.css` | Create | Blog typography styles |
| `src/styles/spacing.css` | Create | Spacing utilities |

---

## Dependencies

```json
{
  "dependencies": {
    "next-themes": "^0.2.1"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.10"
  }
}
```

---

## Testing Checklist

- [ ] Light mode renders with warm off-white background
- [ ] Dark mode renders with charcoal background
- [ ] Theme toggle persists preference
- [ ] No flash of wrong theme on page load
- [ ] All text meets WCAG AA contrast ratios
- [ ] Typography is comfortable to read
- [ ] Spacing is consistent across pages
- [ ] All shadcn/ui components render correctly in both modes

---

## Notes

- Start with this phase before any other UI work
- All subsequent phases should use these tokens exclusively
- Never hardcode hex values in components
- Test both themes frequently during development
