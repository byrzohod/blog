# Phase 1: Foundation Implementation

**Status:** Not Started
**Priority:** Critical
**Dependencies:** None (but Phase 0 can run in parallel)
**Estimated Tasks:** 12

---

## Overview

Set up the core project infrastructure including Next.js, database, and basic layout. This phase creates the foundation that all other features build upon.

---

## Goals

1. Initialize Next.js 14+ with App Router and TypeScript
2. Configure development tools (ESLint, Prettier)
3. Set up PostgreSQL with Docker
4. Initialize Prisma ORM with base schema
5. Create responsive base layout

---

## Tasks

### 1.1 Initialize Next.js Project

Create new Next.js project with TypeScript and App Router.

```bash
npx create-next-app@latest blog --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Configuration choices:**
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Import alias: `@/*`

**Acceptance Criteria:**
- [ ] Project runs with `npm run dev`
- [ ] TypeScript strict mode enabled
- [ ] App Router structure in place
- [ ] Import aliases working

---

### 1.2 Configure ESLint and Prettier

**Files:**
- `.eslintrc.json`
- `.prettierrc`
- `.prettierignore`

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Dependencies:**
```bash
npm install -D prettier eslint-config-prettier @typescript-eslint/eslint-plugin
```

**Acceptance Criteria:**
- [ ] ESLint catches TypeScript errors
- [ ] Prettier formats on save
- [ ] No conflicts between ESLint and Prettier

---

### 1.3 Set Up Tailwind CSS

Tailwind is installed by create-next-app. Verify and enhance configuration.

**File:** `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Will be expanded in Phase 0 (Design System)
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};

export default config;
```

**Dependencies:**
```bash
npm install -D @tailwindcss/typography @tailwindcss/forms
```

**Acceptance Criteria:**
- [ ] Tailwind classes work in components
- [ ] Typography plugin available for prose
- [ ] Forms plugin styles form elements

---

### 1.4 Install and Configure shadcn/ui

```bash
npx shadcn@latest init
```

**Configuration:**
- Style: Default
- Base color: Slate (will customize)
- CSS variables: Yes
- Tailwind config: tailwind.config.ts
- Components location: src/components/ui
- Utils location: src/lib/utils

**Install core components:**
```bash
npx shadcn@latest add button card input label textarea
npx shadcn@latest add dropdown-menu dialog sheet
npx shadcn@latest add avatar badge separator
```

**Acceptance Criteria:**
- [ ] shadcn/ui components render correctly
- [ ] Components use CSS variables
- [ ] Dark mode works with components

---

### 1.5 Create Docker Compose for PostgreSQL

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: blog_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: blog_password
      POSTGRES_DB: blog_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Optional: Mailpit for email testing
  mailpit:
    image: axllent/mailpit
    container_name: blog_mailpit
    restart: unless-stopped
    ports:
      - '1025:1025'  # SMTP
      - '8025:8025'  # Web UI

volumes:
  postgres_data:
```

**Acceptance Criteria:**
- [ ] PostgreSQL starts with `docker compose up -d`
- [ ] Database accessible on localhost:5432
- [ ] Data persists across container restarts
- [ ] Mailpit accessible at localhost:8025 (optional)

---

### 1.6 Initialize Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

**File:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Base models - will be expanded in later phases

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  role          Role      @default(SUBSCRIBER)
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

enum Role {
  ADMIN
  AUTHOR
  SUBSCRIBER
}
```

**File:** `src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

**Acceptance Criteria:**
- [ ] Prisma schema valid
- [ ] Prisma Client generates without errors
- [ ] Database connection works

---

### 1.7 Create Initial Database Migration

```bash
npx prisma migrate dev --name init
```

**Acceptance Criteria:**
- [ ] Migration creates users table
- [ ] Migration files in `prisma/migrations`
- [ ] Can connect and query database

---

### 1.8 Set Up Environment Variables

**File:** `.env.example`

```env
# Database
DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db"

# NextAuth (will be configured in Phase 2)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (optional, Phase 2)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email (Phase 7)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""

# Upload settings
UPLOAD_MAX_SIZE="5242880"
```

**File:** `.env` (local, git-ignored)

Copy from `.env.example` and fill in values.

**Acceptance Criteria:**
- [ ] `.env.example` committed to git
- [ ] `.env` in `.gitignore`
- [ ] All required variables documented

---

### 1.9 Create Base Layout Component

**File:** `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Book of Life | Personal Blog',
    template: '%s | Book of Life',
  },
  description: 'A personal blog sharing thoughts, experiences, and stories.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Acceptance Criteria:**
- [ ] Layout wraps all pages
- [ ] Font loads correctly
- [ ] Theme provider wraps content
- [ ] Flex layout for sticky footer

---

### 1.10 Create Header Component

**File:** `src/components/layout/header.tsx`

```typescript
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-wide flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">Book of Life</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/blog" className="text-foreground-muted hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link href="/about" className="text-foreground-muted hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-foreground-muted hover:text-foreground transition-colors">
            Contact
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {/* Auth buttons will be added in Phase 2 */}
        </div>
      </div>
    </header>
  );
}
```

**Acceptance Criteria:**
- [ ] Sticky header on scroll
- [ ] Navigation links work
- [ ] Theme toggle visible
- [ ] Responsive (mobile menu in later task)

---

### 1.11 Create Footer Component

**File:** `src/components/layout/footer.tsx`

```typescript
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background-subtle">
      <div className="container-wide py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4">Book of Life</h3>
            <p className="text-foreground-muted text-sm">
              A personal chronicle of thoughts, experiences, and stories.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog" className="text-foreground-muted hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-foreground-muted hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-foreground-muted hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/feed.xml" className="text-foreground-muted hover:text-foreground">
                  RSS Feed
                </Link>
              </li>
            </ul>
          </div>

          {/* Subscribe */}
          <div>
            <h4 className="font-semibold mb-4">Stay Updated</h4>
            <p className="text-foreground-muted text-sm mb-4">
              Subscribe to get notified of new posts.
            </p>
            {/* Subscription form will be added in Phase 7 */}
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-foreground-muted">
          <p>&copy; {currentYear} Sarkis Haralampiev. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
```

**Acceptance Criteria:**
- [ ] Footer at bottom of page
- [ ] Links work correctly
- [ ] Year updates automatically
- [ ] Responsive grid layout

---

### 1.12 Create Homepage Placeholder

**File:** `src/app/page.tsx`

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="container-wide">
      {/* Hero Section */}
      <section className="py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Book of Life
        </h1>
        <p className="text-xl text-foreground-muted max-w-2xl mx-auto mb-8">
          A personal chronicle of thoughts, experiences, and stories.
          Welcome to my corner of the internet.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/blog">Read the Blog</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/about">About Me</Link>
          </Button>
        </div>
      </section>

      {/* Featured Posts - Placeholder */}
      <section className="py-16">
        <h2 className="text-3xl font-bold mb-8">Latest Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Post cards will be rendered here */}
          <div className="bg-background-subtle border border-border rounded-lg p-6">
            <p className="text-foreground-muted">Posts coming soon...</p>
          </div>
        </div>
      </section>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Homepage loads at `/`
- [ ] Hero section displays correctly
- [ ] Buttons link to correct pages
- [ ] Responsive layout

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modified | Dependencies |
| `.eslintrc.json` | Modified | ESLint config |
| `.prettierrc` | Created | Prettier config |
| `tailwind.config.ts` | Modified | Tailwind config |
| `docker-compose.yml` | Created | Database container |
| `prisma/schema.prisma` | Created | Database schema |
| `src/lib/db.ts` | Created | Prisma client |
| `.env.example` | Created | Environment template |
| `src/app/layout.tsx` | Modified | Root layout |
| `src/components/layout/header.tsx` | Created | Site header |
| `src/components/layout/footer.tsx` | Created | Site footer |
| `src/app/page.tsx` | Modified | Homepage |

---

## Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "next-themes": "^0.2.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "prettier": "^3.x",
    "eslint-config-prettier": "^9.x",
    "@tailwindcss/typography": "^0.5.x",
    "@tailwindcss/forms": "^0.5.x"
  }
}
```

---

## Commands Reference

```bash
# Start development
docker compose up -d          # Start PostgreSQL
npm run dev                   # Start Next.js

# Database
npx prisma migrate dev        # Run migrations
npx prisma studio             # Visual database browser
npx prisma generate           # Regenerate client

# Code quality
npm run lint                  # Run ESLint
npm run format                # Run Prettier
```

---

## Testing Checklist

- [ ] `npm run dev` starts without errors
- [ ] Homepage renders correctly
- [ ] Header and footer visible
- [ ] Theme toggle switches modes
- [ ] Database connection works
- [ ] Prisma Studio can open
- [ ] All links navigate correctly
- [ ] Responsive on mobile

---

## Notes

- This phase can run in parallel with Phase 0 (Design System)
- The layout uses placeholder colors until design tokens are applied
- Mobile navigation menu will be enhanced later
- Authentication buttons added in Phase 2
