# Project Context for Claude

This file contains essential context about the blog project that should be understood at all times.

---

## Project Overview

**Name:** Book of Life - Personal Blog Platform
**Owner:** Sarkis Haralampiev
**Purpose:** A personal blog for sharing thoughts, articles, and life experiences with community engagement features.

---

## Tech Stack

| Layer | Technology | License |
|-------|------------|---------|
| Framework | Next.js 16.1.1 (App Router) | MIT |
| Language | TypeScript | Apache 2.0 |
| Database | PostgreSQL | PostgreSQL License |
| ORM | Prisma | Apache 2.0 |
| Auth | NextAuth.js (Auth.js) | ISC |
| Styling | Tailwind CSS v4 | MIT |
| Components | shadcn/ui (Radix primitives) | MIT |
| Rich Text | Tiptap | MIT |
| Forms | React Hook Form + Zod | MIT |
| Images | Sharp | Apache 2.0 |
| Container | Docker + Docker Compose | Apache 2.0 |
| Unit Testing | Vitest + Testing Library | MIT |
| E2E Testing | Playwright | Apache 2.0 |

**Principle:** 100% open source technologies only. No paid services or proprietary dependencies.

---

## Application Features

### Public Features
- **Homepage** - Hero section with featured posts and recent articles
- **Blog Listing** - Paginated posts with category/tag filtering
- **Blog Post** - Full article view with rich content, reading time, share buttons
- **Categories** - Filter posts by category (Technology, Life, Travel, etc.)
- **Tags** - Filter posts by tags (nextjs, react, typescript, etc.)
- **Search** - Full-text search across posts with debounced input
- **About Page** - Static page with author information
- **Contact Page** - Contact form with email validation
- **Subscribe Page** - Email newsletter subscription
- **RSS/JSON Feed** - /feed.xml and /feed.json for feed readers
- **Archive** - Chronological listing of all posts
- **Sitemap/Robots** - SEO optimization files

### Authentication Features
- **Login** - Email/password authentication
- **Register** - User registration with validation
- **Password Reset** - Forgot password and reset flow via email
- **Google OAuth** - Sign in with Google (optional)
- **Role-based Access** - ADMIN, AUTHOR, SUBSCRIBER roles
- **Protected Routes** - Middleware-based route protection

### Admin Features
- **Dashboard** - Stats overview (posts, comments, subscribers, views)
- **Post Management** - Create, edit, delete posts with Tiptap rich text editor
- **Category Management** - CRUD for categories with slug generation and color coding
- **Tag Management** - CRUD for tags with association tracking
- **Comment Moderation** - Approve, reject, delete comments with filtering
- **User Management** - View, edit roles, and manage users
- **Media Library** - Upload, manage, and organize images with metadata
- **Image Upload** - Direct image upload with drag-and-drop support
- **Subscriber Management** - View and manage newsletter subscribers
- **Activity Log** - Track all admin actions with filtering by entity/action type
- **Analytics** - View post views, popular content, and traffic statistics
- **Settings** - Site configuration and preferences

### Accessibility Features
- **Skip Links** - Skip to main content
- **ARIA Landmarks** - Proper semantic structure
- **Keyboard Navigation** - Full keyboard support
- **Focus Management** - Visible focus indicators
- **Screen Reader Support** - Alt text, labels, roles

---

## Project Structure

```
blog/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (public)/             # Public pages (blog, about, contact)
│   │   ├── (auth)/               # Auth pages (login, register)
│   │   ├── admin/                # Protected admin dashboard
│   │   ├── api/                  # API route handlers
│   │   ├── actions/              # Server Actions
│   │   └── globals.css           # Global styles with CSS custom properties
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components (themed)
│   │   ├── blog/                 # Blog-specific components
│   │   ├── editor/               # Rich text editor components
│   │   └── layout/               # Header, footer, navigation, skip-link
│   ├── styles/
│   │   └── design-tokens.ts      # Centralized color, spacing, typography tokens
│   ├── lib/                      # Utilities (db, auth, helpers)
│   ├── types/                    # TypeScript type definitions
│   └── __tests__/                # Unit/integration tests (Vitest)
│       ├── setup.ts              # Test setup with mocks
│       ├── components/           # Component tests
│       └── lib/                  # Utility tests
├── e2e/                          # Playwright E2E tests
│   ├── fixtures/                 # Test fixtures (auth, data)
│   ├── pages/                    # Page Object Models
│   └── *.spec.ts                 # Test specifications
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   ├── seed.ts                   # Production seed data
│   └── seed-test.ts              # Test seed data
├── public/uploads/               # User-uploaded files
├── playwright.config.ts          # Playwright configuration
├── vitest.config.ts              # Vitest configuration
└── docker-compose.yml            # Development database (PostgreSQL + Mailpit)
```

---

## Testing Requirements

**IMPORTANT:** Every new feature, bug fix, and code change MUST include comprehensive tests:

### Test Pyramid

```
       /\
      /  \       E2E UI Tests (Playwright)
     /----\      - Full user flows across browsers
    /      \     - Visual and interaction testing
   /--------\
  /          \   Integration Tests (Vitest)
 /            \  - API routes, Server Actions
/--------------\ - Database operations, Auth flows
|              |
|  Unit Tests  | Unit Tests (Vitest)
|   (Vitest)   | - Utility functions, Helpers
|              | - Component rendering
----------------
```

### 1. Unit Tests (Vitest + Testing Library)

**Location:** `src/__tests__/`
**Config:** `vitest.config.ts`
**Run:** `npm test`

Test individual functions and components in isolation:

```typescript
// src/__tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, generateSlug } from '@/lib/utils';

describe('formatDate', () => {
  it('should format date correctly', () => {
    expect(formatDate(new Date('2024-01-15'))).toBe('January 15, 2024');
  });
});
```

```typescript
// src/__tests__/components/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### 2. Integration Tests (Vitest)

**Location:** `src/__tests__/integration/`
**Run:** `npm test`

Test how multiple parts work together:

```typescript
// src/__tests__/integration/auth.test.ts
import { describe, it, expect } from 'vitest';
import { validateCredentials } from '@/lib/auth';

describe('Authentication', () => {
  it('should validate correct credentials', async () => {
    const result = await validateCredentials('admin@test.com', 'password');
    expect(result).toBeTruthy();
  });
});
```

### 3. E2E UI Tests (Playwright)

**Location:** `e2e/`
**Config:** `playwright.config.ts`
**Run:** `npm run test:e2e`

Test full user flows across browsers:

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('should login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@test.com');
  await page.getByLabel('Password').fill('TestPassword123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL('/');
});
```

### Test Coverage Requirements

| Test Type | Coverage Target | Focus Areas |
|-----------|----------------|-------------|
| Unit | 80%+ | Utils, helpers, pure functions |
| Integration | 70%+ | API routes, Server Actions, auth |
| E2E UI | All user flows | Critical paths, happy paths, error states |

### Writing Tests for New Features

When implementing any new feature:

1. **Start with test plan** - Define what needs to be tested
2. **Write unit tests** - For any new utility functions
3. **Write integration tests** - For API endpoints and Server Actions
4. **Write E2E tests** - For user-facing functionality
5. **Test error states** - Validation errors, network errors, edge cases
6. **Test accessibility** - Keyboard nav, screen readers, ARIA

---

## E2E Test Suites

Current E2E test coverage (248 tests per browser, 1240 total across 5 browsers):

| Suite | Description |
|-------|-------------|
| `home.spec.ts` | Homepage, navigation, theme toggle |
| `auth.spec.ts` | Login, register, logout, protected routes |
| `blog.spec.ts` | Blog listing, categories, tags, posts |
| `search.spec.ts` | Search functionality |
| `subscription.spec.ts` | Email subscription, RSS, JSON feed |
| `contact.spec.ts` | Contact form validation and submission |
| `password-reset.spec.ts` | Password reset flow with email |
| `email-verification.spec.ts` | Email verification and resend flow |
| `admin-dashboard.spec.ts` | Admin dashboard and navigation |
| `admin-posts.spec.ts` | Post CRUD with rich text editor |
| `admin-categories.spec.ts` | Category management |
| `admin-tags.spec.ts` | Tag management |
| `admin-comments.spec.ts` | Comment moderation |
| `admin-users.spec.ts` | User management and roles |
| `admin-subscribers.spec.ts` | Subscriber management |
| `admin-media.spec.ts` | Media library operations |
| `admin-image-upload.spec.ts` | Image upload functionality |
| `admin-activity.spec.ts` | Activity log and filtering |
| `admin-analytics.spec.ts` | Analytics dashboard |
| `admin-settings.spec.ts` | Site settings |
| `accessibility.spec.ts` | Skip links, landmarks, keyboard nav |

### E2E Test Patterns

**Page Object Models** (`e2e/pages/`):
```typescript
// e2e/pages/post-editor.page.ts
export class PostEditorPage {
  constructor(private page: Page) {}

  async fillTitle(title: string) {
    await this.page.getByLabel('Title').fill(title);
  }

  async publish() {
    await this.page.getByRole('button', { name: /publish/i }).click();
  }
}
```

**Auth Fixtures** (`e2e/fixtures/auth.fixture.ts`):
```typescript
export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await loginAs(page, TEST_USERS.admin);
    await use(page);
  },
});
```

### E2E Test Writing Best Practices

**IMPORTANT:** Follow these patterns to avoid flaky tests:

#### 1. Use Exact Matchers to Avoid Strict Mode Violations

```typescript
// BAD - matches multiple elements
await page.getByRole('heading', { name: 'Users' }).click();
await page.getByRole('button', { name: /next/i }).click();

// GOOD - exact match prevents ambiguity
await page.getByRole('heading', { name: 'Users', exact: true }).click();
await page.getByRole('button', { name: 'Next', exact: true }).click();
```

#### 2. Wait for Client Hydration in Client Components

```typescript
// For pages with 'use client' components
await page.goto('/resend-verification');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);  // Wait for React hydration
await expect(page.getByRole('heading')).toBeVisible({ timeout: 10000 });
```

#### 3. Use Auth Fixture Correctly

```typescript
// BAD - page and context not available with auth fixture
test('clipboard test', async ({ page, context }) => {  // WRONG!
  await context.grantPermissions(['clipboard-read']);
});

// GOOD - use adminPage from fixture, get context from it
test('clipboard test', async ({ adminPage }) => {
  const context = adminPage.context();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});
```

#### 4. Handle Dynamic Content with Proper Waits

```typescript
// BAD - brittle timeout
await page.waitForTimeout(5000);

// GOOD - wait for specific element or condition
await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });
await page.waitForLoadState('networkidle');
```

#### 5. Force Click for Hidden Interactive Elements

```typescript
// When element appears on hover
await mediaCard.locator('button[title="View details"]').click({ force: true });
```

### Common Pitfalls and Solutions

| Problem | Solution |
|---------|----------|
| "Strict mode violation" - multiple elements match | Add `{ exact: true }` to selector |
| Test passes locally, fails in CI | Add explicit waits for hydration and network |
| "adminPage is undefined" | Use `{ adminPage }` fixture, not `{ page, context }` |
| Form validation fails silently | Ensure form state syncs with UI (see TiptapEditor issue below) |
| Element not clickable | Use `{ force: true }` or wait for visibility first |
| Button name matches dev tools | Use exact match: `{ name: 'Next', exact: true }` |

### Known Application Issues (Fixed)

**TiptapEditor Content Sync:** The TiptapEditor component must sync content with React Hook Form:

```typescript
// In post editor pages, content changes must call both:
const handleContentChange = (newContent: string) => {
  setContent(newContent);  // Local state
  setValue('content', newContent, { shouldValidate: true });  // Form state
};
```

Without this, form validation shows "Content is required" even when content is visible.

---

## Development Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm/npm

### Quick Start

```bash
# 1. Clone and install
git clone https://github.com/byrzohod/blog.git
cd blog
npm install

# 2. Start services
docker compose up -d

# 3. Setup database
npx prisma migrate dev
npx prisma db seed

# 4. Start development
npm run dev
```

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| Next.js App | 3001 | http://localhost:3001 |
| PostgreSQL | 5435 | localhost:5435 |
| Mailpit SMTP | 1025 | localhost:1025 |
| Mailpit UI | 8025 | http://localhost:8025 |

### Test Credentials (After `npm run test:seed`)

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@test.com | TestPassword123! |
| AUTHOR | author@test.com | TestPassword123! |
| SUBSCRIBER | subscriber@test.com | TestPassword123! |

**Note:** For production seed (`npx prisma db seed`), use admin@bookoflife.com / admin123

---

## All Commands Reference

### Development

```bash
npm run dev                    # Start dev server (port 3001)
npm run build                  # Production build
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run type-check             # TypeScript type checking
```

### Database

```bash
docker compose up -d           # Start PostgreSQL + Mailpit
docker compose down            # Stop services
npx prisma migrate dev         # Create/apply migrations
npx prisma migrate reset       # Reset database (destructive)
npx prisma generate            # Regenerate Prisma Client
npx prisma db seed             # Seed with production data
npm run test:seed              # Seed with test data
npx prisma studio              # Visual database browser
```

### Testing

```bash
# Unit & Integration Tests (Vitest)
npm test                       # Run all unit tests
npm test -- --watch            # Watch mode
npm test -- --coverage         # With coverage report
npm test -- path/to/test       # Run specific test file

# E2E Tests (Playwright)
npm run test:e2e               # Run all E2E tests (all browsers)
npx playwright test --project=chromium  # Chromium only (fastest)
npx playwright test --project=firefox   # Firefox only
npx playwright test --project=webkit    # Safari only
npx playwright test e2e/auth.spec.ts    # Run specific test file
npx playwright test --ui                 # Interactive UI mode
npx playwright test --debug              # Debug mode with inspector
npx playwright show-report               # View HTML test report
npx playwright codegen                   # Generate tests by recording
```

### Code Quality

```bash
npm run lint                   # ESLint
npm run type-check             # TypeScript
npx prettier --write .         # Format code
```

---

## Debugging Guide

### Debug Next.js Server

```bash
# Start with Node.js inspector
NODE_OPTIONS='--inspect' npm run dev

# Open Chrome DevTools: chrome://inspect
```

### Debug Playwright Tests

```bash
# Interactive debug mode
npx playwright test --debug

# UI mode with trace viewer
npx playwright test --ui

# View trace after failure
npx playwright show-trace trace.zip
```

### Debug Database

```bash
# Open Prisma Studio
npx prisma studio

# Check database logs
docker compose logs db

# Connect directly
docker exec -it blog-db psql -U postgres -d blog
```

### Debug Email (Mailpit)

Open http://localhost:8025 to view all sent emails during development.

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3001"
    },
    {
      "name": "Playwright: debug tests",
      "type": "node-terminal",
      "request": "launch",
      "command": "npx playwright test --debug"
    }
  ]
}
```

---

## Required Skills

### Core Framework & Language

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| TypeScript | All code, strict mode | Essential | typescriptlang.org |
| React 19 | UI components, hooks, state | Essential | react.dev |
| Next.js 16 (App Router) | Framework, routing, SSR/SSG | Essential | nextjs.org/docs |
| Server Components | Default rendering strategy | Essential | nextjs.org/docs/app |
| Server Actions | Form mutations, data updates | Essential | nextjs.org/docs/app/api-reference/functions/server-actions |

### Styling & UI Components

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| Tailwind CSS v4 | All styling, responsive design | Essential | tailwindcss.com |
| CSS Custom Properties | Design tokens, theming | Important | developer.mozilla.org |
| shadcn/ui | Pre-built accessible components | Important | ui.shadcn.com |
| Radix UI Primitives | Underlying component library | Good to know | radix-ui.com |
| Lucide Icons | Icon library | Good to know | lucide.dev |

### Forms & Validation

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| React Hook Form | Form state management | Essential | react-hook-form.com |
| Zod | Schema validation, type inference | Essential | zod.dev |
| Form-Zod Integration | zodResolver for validation | Important | github.com/react-hook-form/resolvers |

### Rich Text & Media

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| Tiptap | Rich text editor for posts | Important | tiptap.dev |
| ProseMirror | Underlying editor framework | Good to know | prosemirror.net |
| Sharp | Image processing, optimization | Good to know | sharp.pixelplumbing.com |

### Database & ORM

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| PostgreSQL | Database | Essential | postgresql.org |
| Prisma | ORM, migrations, queries | Essential | prisma.io/docs |
| Prisma Schema | Data modeling | Essential | prisma.io/docs/concepts/components/prisma-schema |
| Database Relations | One-to-many, many-to-many | Important | prisma.io/docs/concepts/components/prisma-schema/relations |

### Authentication & Security

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| NextAuth.js v5 | Authentication framework | Essential | authjs.dev |
| JWT Strategy | Session management | Important | jwt.io |
| bcrypt | Password hashing | Important | github.com/kelektiv/node.bcrypt.js |
| Middleware | Route protection | Important | nextjs.org/docs/app/building-your-application/routing/middleware |
| CSRF Protection | Security | Good to know | owasp.org |

### Testing (Critical)

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| Vitest | Unit & integration tests | Essential | vitest.dev |
| Testing Library | Component testing | Essential | testing-library.com |
| Playwright | E2E browser testing | Essential | playwright.dev |
| Page Object Model | Test organization pattern | Important | playwright.dev/docs/pom |
| Test Fixtures | Auth & data setup | Important | playwright.dev/docs/test-fixtures |
| Locator Strategies | Element selection | Important | playwright.dev/docs/locators |
| Assertions | expect, toBeVisible, etc. | Essential | playwright.dev/docs/test-assertions |

### DevOps & Tooling

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| Docker & Compose | Local PostgreSQL, Mailpit | Essential | docs.docker.com |
| Git | Version control | Essential | git-scm.com |
| npm/pnpm | Package management | Essential | docs.npmjs.com |
| ESLint | Code linting | Important | eslint.org |
| Prettier | Code formatting | Good to know | prettier.io |
| GitHub Actions | CI/CD (planned) | Future | docs.github.com/actions |

### Email & Notifications

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| Nodemailer | Email sending | Important | nodemailer.com |
| SMTP | Email protocol | Good to know | - |
| Mailpit | Local email testing | Important | mailpit.axllent.org |

### API & Data Fetching

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| REST APIs | API route handlers | Important | nextjs.org/docs/app/building-your-application/routing/route-handlers |
| Fetch API | Data fetching | Essential | developer.mozilla.org |
| Error Handling | Try/catch, error boundaries | Important | react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary |

### Accessibility (A11y)

| Skill | Usage | Priority | Learn More |
|-------|-------|----------|------------|
| ARIA Attributes | Screen reader support | Important | developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA |
| Semantic HTML | Proper element usage | Important | developer.mozilla.org |
| Keyboard Navigation | Focus management | Important | w3.org/WAI/ARIA/apg/ |
| WCAG Guidelines | Contrast, readability | Good to know | w3.org/WAI/WCAG21/quickref/ |

### Skill Priority Legend

- **Essential**: Must know to work on this project
- **Important**: Frequently used, should understand well
- **Good to know**: Helpful but can learn as needed
- **Future**: Planned features, not yet implemented

---

## Key Conventions

### Code Style

- Use TypeScript strict mode
- Prefer Server Components by default
- Use 'use client' only when necessary (forms, interactivity)
- Follow Next.js App Router conventions
- Use Zod for all input validation
- Prefer Server Actions over API routes for mutations

### Naming Conventions

- **Files:** kebab-case (`post-card.tsx`)
- **Components:** PascalCase (`PostCard`)
- **Functions:** camelCase (`createPost`)
- **Database:** snake_case in Prisma schema maps to camelCase in code
- **Routes:** kebab-case (`/blog/my-first-post`)
- **Test Files:** `*.test.ts`, `*.test.tsx`, `*.spec.ts`

### Component Organization

```tsx
// 1. Imports
// 2. Types/Interfaces
// 3. Component
// 4. Sub-components (if small)
// 5. Export
```

---

## Database Models

| Model | Purpose |
|-------|---------|
| User | Authentication, roles (ADMIN, AUTHOR, SUBSCRIBER) |
| Post | Blog posts with draft/published status |
| PostImage | Post featured images and gallery |
| Category | Post categorization with colors |
| Tag | Post tagging (many-to-many) |
| Comment | User comments with moderation status |
| Subscriber | Email newsletter subscribers |
| Page | Static pages (about, contact) |
| Media | Uploaded files tracking with metadata |
| PasswordResetToken | Password reset flow tokens |
| VerificationToken | Email verification tokens |
| ActivityLog | Admin action audit trail |
| Session | User sessions (NextAuth) |
| Account | OAuth account linking (NextAuth) |

---

## Authentication

- **NextAuth.js** with Credentials + Google providers
- **Roles:** ADMIN (full access), AUTHOR (own posts), SUBSCRIBER (comments)
- **Protected routes:** `/admin/*` requires ADMIN or AUTHOR
- **Middleware:** `src/middleware.ts` handles route protection
- **JWT Strategy:** Session stored in cookies

---

## Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5435/blog"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email (Mailpit in dev)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_FROM="noreply@bookoflife.com"
```

---

## Design System & Eye Comfort

### Core Principle: Reader Comfort First

**IMPORTANT:** This blog prioritizes eye comfort. Never use pure white (`#FFFFFF`) backgrounds for reading areas. Screens should feel warm and easy on the eyes, especially for long reading sessions.

### Color Tokens

All colors defined in `src/styles/design-tokens.ts` and mapped to Tailwind in `globals.css`.

#### Light Mode (Warm, Not Harsh)

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#FAF9F7` | Main page background (warm off-white) |
| `--foreground` | `#1A1A1A` | Primary text (not pure black) |
| `--accent` | `#2563EB` | Links, buttons, interactive |

#### Dark Mode (True Dark, Not Pure Black)

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#1C1C1E` | Main page background |
| `--foreground` | `#F5F5F5` | Primary text |
| `--accent` | `#60A5FA` | Links, buttons |

### Design Rules

1. **Never use `#FFFFFF`** - Always use `--background` token
2. **Never use `#000000`** - Always use `--foreground` token
3. **Contrast ratio** - Maintain WCAG AA (4.5:1 for text)
4. **Reading width** - Max 65-75 characters per line (`max-w-prose`)

---

## Important Patterns

### Server Actions (Mutations)

```tsx
// src/app/actions/posts.ts
'use server'
export async function createPost(data: PostInput) {
  // Validate with Zod, save with Prisma
}
```

### Data Fetching

```tsx
// In Server Components
const posts = await prisma.post.findMany({ where: { status: 'PUBLISHED' } })
```

### Form Handling

```tsx
// Use React Hook Form + Zod
const form = useForm<PostInput>({ resolver: zodResolver(postSchema) })
```

---

## GitHub

- **Repository:** github.com/byrzohod/blog
- **Branch:** main
- **CI/CD:** GitHub Actions (to be configured)

---

## Notes for Claude

### Mandatory Requirements

1. **Always write tests** - Every feature needs unit, integration, AND E2E tests
2. **Test all user flows** - Happy paths, error states, edge cases
3. **Follow test pyramid** - More unit tests, fewer E2E tests
4. **Use Page Object Models** - For E2E test organization
5. **Test accessibility** - Keyboard navigation, screen readers

### Code Quality

1. **Always use open source solutions** - No Azure, AWS paid services, or proprietary tools
2. **Prefer simplicity** - Don't over-engineer; add complexity only when needed
3. **TypeScript strict** - All code should be properly typed
4. **Security first** - Validate all inputs, sanitize outputs, use parameterized queries
5. **Follow Next.js 16+ patterns** - App Router, Server Components, Server Actions

### Design & UX

1. **Follow design system** - Use color tokens from design-tokens.ts, never raw hex values
2. **Eye comfort priority** - No pure white/black backgrounds, warm tones for reading
3. **Tailwind v4** - Uses `@theme` in globals.css, not tailwind.config.ts

### Development

1. **Port 3001** - App runs on port 3001 (not 3000) to avoid conflicts
2. **Docker required** - Database runs in Docker container
3. **Seed before testing** - Run `npm run test:seed` for E2E test data

### Middleware Public Routes

When adding new public pages, update `src/middleware.ts` to allow unauthenticated access:

```typescript
// Current public routes in middleware:
pathname.startsWith('/login') ||
pathname.startsWith('/register') ||
pathname.startsWith('/forgot-password') ||
pathname.startsWith('/reset-password') ||
pathname.startsWith('/resend-verification') ||  // Don't forget this one!
pathname.startsWith('/api/auth') ||
// ... etc
```

### E2E Test Gotchas

1. **Use test credentials** - `admin@test.com` / `TestPassword123!` (not production creds)
2. **Auth fixture provides `adminPage`** - Not `page` or `context`
3. **Use exact matchers** - Add `{ exact: true }` to avoid matching multiple elements
4. **Wait for hydration** - Client components need extra wait time after navigation
5. **TiptapEditor sync** - Content must sync to form state with `setValue()`

---

## Test Commands Cheat Sheet

```bash
# Quick test run (fastest)
npm test                                    # Unit tests
npx playwright test --project=chromium      # E2E - Chromium only (fastest)

# Full test suite
npm run test:e2e                            # All 5 browsers (248 tests each)

# Debug tests
npm test -- --watch                         # Unit - watch mode
npx playwright test --ui                    # E2E - interactive mode
npx playwright test --debug                 # E2E - step through
PWDEBUG=1 npx playwright test               # E2E - with inspector

# Coverage
npm test -- --coverage                      # Unit test coverage
npx playwright show-report                  # E2E test report

# Specific tests
npm test -- path/to/file                    # Run specific unit test
npx playwright test e2e/auth.spec.ts        # Run specific E2E test
npx playwright test -g "login"              # Run tests matching pattern
npx playwright test e2e/admin-posts.spec.ts --project=chromium  # Single file, single browser

# Before running E2E tests
npm run test:seed                           # Reset DB with test data
docker compose up -d                        # Ensure services running
npm run dev                                 # Start dev server (port 3001)

# Useful for debugging failures
npx playwright test --trace on              # Capture trace for failures
npx playwright show-trace trace.zip         # View trace file
```
