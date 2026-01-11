# Blog Site - Project Plan

## Overview

A personal blog platform for sharing thoughts, articles, and life experiences with rich content creation capabilities and community engagement features.

---

## Tech Stack

### Recommended: Full-Stack .NET + Angular (Leverage Your Experience)

#### Backend
- **Framework:** ASP.NET Core 8 Web API
- **Database:** PostgreSQL (or SQL Server if preferred)
- **ORM:** Entity Framework Core
- **Authentication:** ASP.NET Core Identity + Google OAuth
- **File Storage:** Azure Blob Storage / AWS S3 / Local storage
- **Caching:** Redis (for sessions, subscription notifications)

#### Frontend
- **Framework:** Angular 17+ (standalone components)
- **UI Library:** Angular Material or Tailwind CSS
- **Rich Text Editor:** Quill.js, TinyMCE, or Editor.js
- **State Management:** NgRx or Angular Signals

#### Infrastructure
- **Hosting:** Azure App Service / AWS / DigitalOcean
- **CI/CD:** GitHub Actions
- **Containerization:** Docker (optional but recommended)

---

### Alternative: Modern Full-Stack (If Open to Learning)

#### Option A: Next.js + Supabase
- **Frontend/Backend:** Next.js 14 (App Router)
- **Database + Auth:** Supabase (PostgreSQL + built-in auth)
- **Styling:** Tailwind CSS
- **Rich Text:** Tiptap or Lexical
- **Pros:** Faster development, built-in auth, real-time subscriptions

#### Option B: .NET Backend + React/Next.js Frontend
- Hybrid approach keeping .NET backend expertise

---

## Core Features

### Phase 1: Foundation
- [ ] Project setup and architecture
- [ ] Database schema design
- [ ] User authentication (email/password)
- [ ] Basic blog post CRUD operations
- [ ] Simple blog listing page

### Phase 2: Content Creation
- [ ] Rich text editor integration
- [ ] Image upload and management
- [ ] Draft/publish workflow
- [ ] Categories and tags
- [ ] SEO-friendly URLs (slugs)

### Phase 3: Static Pages
- [ ] "About Me" / "Way of Life" pages
- [ ] "Thoughts" section
- [ ] Contact page
- [ ] Custom page builder (optional)

### Phase 4: User Engagement
- [ ] Google OAuth integration
- [ ] Commenting system
- [ ] Comment moderation
- [ ] User profiles

### Phase 5: Subscriptions & Notifications
- [ ] Email subscription system
- [ ] Newsletter functionality
- [ ] "Latest News" feed/widget
- [ ] RSS feed

### Phase 6: Advanced Features (Future)
- [ ] Allow guest authors to submit posts
- [ ] Post approval workflow
- [ ] Analytics dashboard
- [ ] Search functionality
- [ ] Dark mode

---

## Database Schema (High-Level)

```
Users
├── Id, Email, PasswordHash, DisplayName, Avatar
├── GoogleId (for OAuth)
├── Role (Admin, Author, Subscriber, Guest)
└── CreatedAt, UpdatedAt

Posts
├── Id, Title, Slug, Content, Excerpt
├── AuthorId (FK → Users)
├── Status (Draft, Published, Archived)
├── FeaturedImage
├── PublishedAt, CreatedAt, UpdatedAt
└── CategoryId, Tags[]

Categories
├── Id, Name, Slug, Description
└── ParentId (for nested categories)

Comments
├── Id, PostId, UserId, Content
├── ParentId (for replies)
├── Status (Pending, Approved, Spam)
└── CreatedAt

Subscribers
├── Id, Email, Name
├── IsVerified, VerificationToken
├── Preferences (JSON)
└── SubscribedAt

Pages (Static)
├── Id, Title, Slug, Content
├── Template, Order
└── IsPublished

Media
├── Id, FileName, Url, MimeType
├── UploadedBy (FK → Users)
└── CreatedAt
```

---

## Architecture Decisions

### Authentication Strategy
1. **Local accounts** - Email/password with ASP.NET Identity
2. **Google OAuth** - For easy sign-in
3. **Role-based access:**
   - **Admin** - Full control
   - **Author** - Can create/edit own posts
   - **Subscriber** - Can comment, receives newsletters
   - **Guest** - Read-only, can subscribe

### Content Storage
- **Blog content:** Stored as HTML or Markdown in database
- **Images:** Stored in blob storage, referenced by URL
- **Thumbnails:** Auto-generated on upload

### API Design
- RESTful API with versioning (`/api/v1/...`)
- JWT tokens for authentication
- Rate limiting for public endpoints

---

## Open Questions

1. **Guest posting:** Should registered users be able to submit posts for review?
2. **Monetization:** Any plans for paid subscriptions or premium content?
3. **Multi-language:** Will the blog support multiple languages?
4. **Social sharing:** Integration with social media platforms?
5. **Analytics:** Custom analytics or Google Analytics integration?

---

## Next Steps

1. Finalize tech stack decision
2. Set up development environment
3. Create initial project structure
4. Design database schema in detail
5. Implement authentication
6. Build basic CRUD for blog posts
