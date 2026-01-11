# Project Context for Claude

This file contains essential context about the blog project that should be understood at all times.

---

## Project Overview

**Name:** Personal Blog Platform
**Owner:** Sarkis Haralampiev
**Purpose:** A personal blog for sharing thoughts, articles, and life experiences with community engagement features.

---

## Tech Stack

| Layer | Technology | License |
|-------|------------|---------|
| Framework | Next.js 14+ (App Router) | MIT |
| Language | TypeScript | Apache 2.0 |
| Database | PostgreSQL | PostgreSQL License |
| ORM | Prisma | Apache 2.0 |
| Auth | NextAuth.js (Auth.js) | ISC |
| Styling | Tailwind CSS | MIT |
| Components | shadcn/ui | MIT |
| Rich Text | Tiptap | MIT |
| Forms | React Hook Form + Zod | MIT |
| Images | Sharp | Apache 2.0 |
| Container | Docker + Docker Compose | Apache 2.0 |

**Principle:** 100% open source technologies only. No paid services or proprietary dependencies.

---

## Project Structure

```
blog/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (public)/         # Public pages (blog, about, contact)
│   │   ├── (auth)/           # Auth pages (login, register)
│   │   ├── admin/            # Protected admin dashboard
│   │   └── api/              # API route handlers
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── blog/             # Blog-specific components
│   │   ├── editor/           # Rich text editor components
│   │   └── layout/           # Header, footer, navigation
│   ├── lib/                  # Utilities (db, auth, helpers)
│   └── types/                # TypeScript type definitions
├── prisma/                   # Database schema and migrations
├── public/uploads/           # User-uploaded files
└── docker-compose.yml        # Development database
```

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
| Category | Post categorization |
| Tag | Post tagging (many-to-many) |
| Comment | User comments with moderation |
| Subscriber | Email newsletter subscribers |
| Page | Static pages (about, contact) |
| Media | Uploaded files tracking |

---

## Authentication

- **NextAuth.js** with Credentials + Google providers
- **Roles:** ADMIN (full access), AUTHOR (own posts), SUBSCRIBER (comments)
- **Protected routes:** `/admin/*` requires ADMIN or AUTHOR
- **Middleware:** `src/middleware.ts` handles route protection

---

## Common Commands

```bash
# Development
docker compose up -d          # Start PostgreSQL
npm run dev                   # Start Next.js dev server

# Database
npx prisma migrate dev        # Create/apply migrations
npx prisma studio             # Visual database browser
npx prisma generate           # Regenerate Prisma Client
npx prisma db seed            # Seed database

# Build
npm run build                 # Production build
npm run lint                  # Run ESLint
npm run type-check            # TypeScript check
```

---

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - App URL (http://localhost:3000 in dev)
- `NEXTAUTH_SECRET` - Random secret for JWT
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

---

## Feature Phases

1. **Foundation** - Project setup, database, basic layout
2. **Authentication** - NextAuth, login/register, Google OAuth
3. **Blog Core** - Posts CRUD, rich text editor, images
4. **Static Pages** - About, thoughts, contact
5. **Engagement** - Comments, moderation, user profiles
6. **Subscriptions** - Email subscriptions, newsletter, RSS
7. **Polish** - Dark mode, search, analytics

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

## Open Decisions

- [ ] Allow guest author submissions?
- [ ] Multi-language support?
- [ ] Anonymous comments or login required?
- [ ] Analytics: Plausible, Umami, or custom?

---

## GitHub

- **Repository:** github.com/byrzohod/blog
- **Branch:** main
- **CI/CD:** GitHub Actions (to be configured)

---

## Notes for Claude

1. **Always use open source solutions** - No Azure, AWS paid services, or proprietary tools
2. **Prefer simplicity** - Don't over-engineer; add complexity only when needed
3. **TypeScript strict** - All code should be properly typed
4. **Security first** - Validate all inputs, sanitize outputs, use parameterized queries
5. **Follow Next.js 14+ patterns** - App Router, Server Components, Server Actions
6. **Reference plan.md** - For detailed implementation phases and database schema
