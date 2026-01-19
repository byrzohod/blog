# AGENTS.md

## Purpose

Guidance for agentic coding tools working in this repo. Keep changes aligned with existing conventions, tests, and design system.

## Quick Facts

- Stack: Next.js 16 App Router, React 19, TypeScript strict, Prisma, Tailwind v4, shadcn/ui.
- Runtime: Node.js 20+, local app runs at http://localhost:3001.
- Database: PostgreSQL via Docker Compose.
- Tests: Vitest (unit/integration) + Playwright (E2E).

## Commands

### Dev

- Start dev server: `npm run dev`
- Build: `npm run build`
- Start prod server: `npm run start`

### Lint / Typecheck / Format

- Lint: `npm run lint`
- Type check: `npm run type-check`
- Format: `npx prettier --write .`

### Unit/Integration Tests (Vitest)

- All tests: `npm test`
- Watch mode: `npm test -- --watch`
- Coverage: `npm run test:coverage`
- Single test file: `npm test -- src/__tests__/lib/utils.test.ts`
- Single test by name: `npm test -- -t "formatDate"`

### E2E Tests (Playwright)

- All browsers: `npm run test:e2e`
- Single spec file: `npx playwright test e2e/auth.spec.ts`
- Single project: `npx playwright test --project=chromium`
- Single spec + project: `npx playwright test e2e/admin-posts.spec.ts --project=chromium`
- Match by title: `npx playwright test -g "login"`
- Debug UI: `npx playwright test --ui`
- Debug with inspector: `npx playwright test --debug`

### Database / Seed

- Start services: `docker compose up -d`
- Migrate: `npm run db:migrate`
- Seed prod data: `npm run db:seed`
- Seed test data: `npm run test:seed`

## Code Style

### Imports

- Prefer absolute imports from `@/` (configured in `tsconfig.json`).
- Order: external libs, internal modules, types, styles (if any).
- Type-only imports use `import type`.

### Formatting

- Follow Prettier defaults (repo uses `prettier` dependency).
- Use double quotes in TS/TSX (consistent with current codebase).
- Keep lines readable; avoid overly long chained expressions.

### TypeScript

- Strict mode enabled; no implicit `any`.
- Favor explicit return types on exported functions.
- Use `as const` for literal configuration objects.
- Prefer discriminated unions over `any` or loose objects.

### React / Next.js

- Default to Server Components in `src/app`.
- Add `'use client'` only when needed (forms, interactivity, hooks).
- Use Server Actions for mutations (`'use server'` in action files).
- Use `next/navigation` and App Router conventions.

### Naming

- Files: kebab-case (e.g. `post-card.tsx`).
- Components: PascalCase.
- Functions/variables: camelCase.
- Routes: kebab-case (`/blog/my-first-post`).
- Tests: `*.test.ts`, `*.test.tsx`, `*.spec.ts`.

### Error Handling

- Validate input with Zod for any public-facing data.
- Use `try/catch` in server actions and route handlers; return structured errors.
- Avoid leaking sensitive data in error messages.

### Data Access

- Use Prisma from `src/lib/db.ts`.
- Keep queries in server code only; never in client components.

## UI / Styling

- Tailwind v4 with `@theme` tokens in `src/app/globals.css`.
- Use design tokens from `src/styles/design-tokens.ts` (no raw hex in components).
- Respect eye-comfort rules: avoid pure white/black backgrounds.
- Max reading width: 65–75 characters (`max-w-prose`).

## Tests Policy (Required)

- New features require unit, integration, and E2E tests.
- Use Page Object Models for Playwright (`e2e/pages/`).
- Use auth fixture (`adminPage`) for admin tests.
- Add exact matchers to avoid strict-mode conflicts (`{ exact: true }`).
- Wait for hydration on client pages (`waitForLoadState('networkidle')` + short delay).

## Public Routes

When adding public pages, update `src/middleware.ts` to allow unauthenticated access.

## Repository Rules

- No Cursor rules found (`.cursor/rules/`, `.cursorrules`).
- No Copilot rules found (`.github/copilot-instructions.md`).

## Suggested Workflow

1. Sync database (`docker compose up -d`, `npm run db:migrate`).
2. Make changes in `src/` following conventions.
3. Add tests in `src/__tests__/` and `e2e/`.
4. Run `npm run lint`, `npm run type-check`, and relevant tests.

## Useful Files

- `src/app/globals.css` (theme tokens, base styles)
- `src/styles/design-tokens.ts` (design system tokens)
- `vitest.config.ts` (unit test config)
- `playwright.config.ts` (E2E config)
- `eslint.config.mjs` (lint rules)
