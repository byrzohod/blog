# Blog Site - Project Plan

## Overview

A personal blog platform for sharing thoughts, articles, and life experiences with rich content creation capabilities and community engagement features.

---

## Tech Stack (100% Open Source)

### Next.js Full-Stack with TypeScript

#### Core Framework
- **Framework:** Next.js 14+ App Router (MIT License)
- **Language:** TypeScript (Apache 2.0)
- **Runtime:** Node.js (MIT License)

#### Database & ORM
- **Database:** PostgreSQL (PostgreSQL License - OSI approved)
- **ORM:** Prisma (Apache 2.0) - type-safe database access
- **Migrations:** Prisma Migrate (built-in)

#### Authentication
- **Auth Library:** NextAuth.js / Auth.js (ISC License)
- **Providers:** Email/password + Google OAuth
- **Session:** JWT tokens or database sessions

#### Frontend
- **UI Framework:** React 18+ (MIT License)
- **Styling:** Tailwind CSS (MIT License)
- **Components:** shadcn/ui (MIT) - copy-paste components
- **Icons:** Lucide React (ISC License)
- **Rich Text Editor:** Tiptap (MIT License) - extensible, headless
- **Forms:** React Hook Form (MIT) + Zod validation (MIT)

#### File Handling
- **Upload:** Local filesystem or MinIO (AGPL)
- **Image Processing:** Sharp (Apache 2.0) - resize, optimize
- **Storage Path:** `/public/uploads` or S3-compatible bucket

#### Email
- **Library:** Nodemailer (MIT) or React Email (MIT)
- **Dev Testing:** Mailpit (MIT)
- **Production:** Any SMTP provider

#### Infrastructure
- **Containerization:** Docker + Docker Compose (Apache 2.0)
- **Reverse Proxy:** Caddy (Apache 2.0) - automatic HTTPS
- **Hosting:** Self-hosted VPS (Hetzner/Contabo) or Coolify (Apache 2.0)
- **CI/CD:** GitHub Actions (free for public repos)

#### Development Tools
- **Linting:** ESLint (MIT) + Prettier (MIT)
- **Testing:** Vitest (MIT) + Playwright (Apache 2.0)
- **Dev Database:** Docker PostgreSQL container

---

## Project Structure

```
blog/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/             # Public pages (no auth)
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── blog/             # Blog listing & posts
│   │   │   ├── about/            # About me page
│   │   │   ├── thoughts/         # Thoughts section
│   │   │   └── contact/          # Contact page
│   │   ├── (auth)/               # Auth pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── admin/                # Admin dashboard (protected)
│   │   │   ├── posts/            # Post management
│   │   │   ├── comments/         # Comment moderation
│   │   │   ├── subscribers/      # Subscriber management
│   │   │   └── settings/
│   │   ├── api/                  # API routes
│   │   │   ├── auth/             # NextAuth endpoints
│   │   │   ├── posts/
│   │   │   ├── comments/
│   │   │   ├── subscribe/
│   │   │   └── upload/
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── blog/                 # Blog-specific components
│   │   ├── editor/               # Rich text editor
│   │   └── layout/               # Header, footer, nav
│   ├── lib/                      # Utilities
│   │   ├── db.ts                 # Prisma client
│   │   ├── auth.ts               # Auth configuration
│   │   ├── utils.ts              # Helper functions
│   │   └── validations/          # Zod schemas
│   └── types/                    # TypeScript types
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed data
├── public/
│   ├── uploads/                  # User uploads
│   └── images/                   # Static images
├── docker-compose.yml            # Dev environment
├── Dockerfile                    # Production build
├── .env.example                  # Environment template
└── package.json
```

---

## Core Features

### Phase 1: Foundation
- [ ] Project setup (Next.js + TypeScript + Tailwind)
- [ ] Docker Compose for PostgreSQL
- [ ] Prisma schema and initial migration
- [ ] Basic layout (header, footer, navigation)
- [ ] Homepage with placeholder content

### Phase 2: Authentication
- [ ] NextAuth.js setup
- [ ] Email/password registration and login
- [ ] Google OAuth integration
- [ ] Protected routes middleware
- [ ] User profile page

### Phase 3: Blog Core
- [ ] Blog post listing page
- [ ] Individual post page with slug routing
- [ ] Tiptap rich text editor integration
- [ ] Image upload for posts
- [ ] Draft/publish workflow
- [ ] Categories and tags

### Phase 4: Static Pages
- [ ] "About Me" / "Way of Life" page
- [ ] "Thoughts" section
- [ ] Contact page with form
- [ ] SEO optimization (meta tags, sitemap)

### Phase 5: User Engagement
- [ ] Commenting system
- [ ] Comment moderation (admin)
- [ ] User roles and permissions
- [ ] User profile customization

### Phase 6: Subscriptions & Notifications
- [ ] Email subscription form
- [ ] Subscriber management
- [ ] Newsletter sending
- [ ] "Latest News" widget
- [ ] RSS feed generation

### Phase 7: Polish & Advanced
- [ ] Dark mode toggle
- [ ] Search functionality
- [ ] Analytics dashboard
- [ ] Performance optimization
- [ ] Guest author submissions (optional)

---

## Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String?
  avatar        String?
  role          Role      @default(SUBSCRIBER)
  googleId      String?   @unique
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  posts         Post[]
  comments      Comment[]
  accounts      Account[]
  sessions      Session[]
}

model Post {
  id            String    @id @default(cuid())
  title         String
  slug          String    @unique
  content       String    @db.Text
  excerpt       String?
  featuredImage String?
  status        PostStatus @default(DRAFT)
  publishedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  author        User      @relation(fields: [authorId], references: [id])
  authorId      String
  category      Category? @relation(fields: [categoryId], references: [id])
  categoryId    String?
  tags          Tag[]
  comments      Comment[]
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?
  posts       Post[]
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  posts Post[]
}

model Comment {
  id        String        @id @default(cuid())
  content   String        @db.Text
  status    CommentStatus @default(PENDING)
  createdAt DateTime      @default(now())

  post      Post          @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  author    User          @relation(fields: [authorId], references: [id])
  authorId  String
  parent    Comment?      @relation("CommentReplies", fields: [parentId], references: [id])
  parentId  String?
  replies   Comment[]     @relation("CommentReplies")
}

model Subscriber {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  isVerified   Boolean  @default(false)
  verifyToken  String?
  subscribedAt DateTime @default(now())
}

model Page {
  id          String  @id @default(cuid())
  title       String
  slug        String  @unique
  content     String  @db.Text
  isPublished Boolean @default(false)
  order       Int     @default(0)
}

model Media {
  id        String   @id @default(cuid())
  filename  String
  url       String
  mimeType  String
  size      Int
  createdAt DateTime @default(now())
}

enum Role {
  ADMIN
  AUTHOR
  SUBSCRIBER
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CommentStatus {
  PENDING
  APPROVED
  SPAM
}
```

---

## Architecture Decisions

### Authentication Strategy
- **NextAuth.js** handles all auth flows
- **Credentials provider** for email/password
- **Google provider** for OAuth
- **JWT strategy** for stateless sessions
- **Middleware** protects admin routes

### Content Storage
- **Blog content:** HTML stored in PostgreSQL (Tiptap outputs HTML)
- **Images:** Local `/public/uploads` or MinIO bucket
- **Thumbnails:** Generated on upload with Sharp

### API Design
- **Server Actions** for mutations (Next.js 14+)
- **Route Handlers** for complex API logic
- **Zod** for input validation
- **Prisma** for type-safe queries

### Rendering Strategy
- **Static Generation (SSG):** Blog posts, static pages
- **Server Components:** Default for all pages
- **Client Components:** Interactive elements only (editor, forms)
- **ISR:** Incremental regeneration for blog listing

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/blog"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (production)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASS="your-password"

# Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="5242880"
```

---

## Development Workflow

```bash
# Start development
docker compose up -d          # Start PostgreSQL
npm run dev                   # Start Next.js

# Database
npx prisma migrate dev        # Run migrations
npx prisma studio             # Visual database browser
npx prisma db seed            # Seed test data

# Build & Deploy
npm run build                 # Production build
npm run start                 # Start production server
docker build -t blog .        # Build Docker image
```

---

## Open Questions

1. **Guest posting:** Should registered users be able to submit posts for review?
2. **Multi-language:** Will the blog support multiple languages?
3. **Social sharing:** Integration with social media platforms?
4. **Analytics:** Custom analytics or privacy-friendly alternative (Plausible/Umami)?
5. **Comments:** Allow anonymous comments or require login?

---

## Next Steps

1. Initialize Next.js project with TypeScript
2. Set up Docker Compose for PostgreSQL
3. Configure Prisma and create initial schema
4. Set up NextAuth.js with credentials provider
5. Build basic layout and homepage
6. Implement blog post CRUD
