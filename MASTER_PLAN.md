# Master Plan: Book of Life Blog

A comprehensive feature specification for a personal blog platform designed as a "Book of Life" - a place to share thoughts, experiences, and stories with the world.

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Design System](#design-system)
3. [Core Features](#core-features)
4. [Content Management](#content-management)
5. [Rich Text Editor](#rich-text-editor)
6. [Media Management](#media-management)
7. [Comments System](#comments-system)
8. [Subscription & Distribution](#subscription--distribution)
9. [User Experience](#user-experience)
10. [Admin Dashboard](#admin-dashboard)
11. [SEO & Discovery](#seo--discovery)
12. [Performance & Security](#performance--security)
13. [Future Enhancements](#future-enhancements)
14. [Implementation Phases](#implementation-phases)

---

## Vision & Goals

### The "Book of Life" Concept

This blog serves as a personal chronicle - a digital journal capturing:
- Life experiences and milestones
- Thoughts and reflections
- Articles and tutorials
- Photo stories and memories
- Ideas and creative writing

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Personal Voice** | The blog should feel intimate and authentic |
| **Visual Storytelling** | Rich media support to tell stories with images |
| **Community Connection** | Enable meaningful engagement through comments and subscriptions |
| **Longevity** | Built to last with open source, self-hosted infrastructure |
| **Simplicity** | Easy to write, easy to read, easy to maintain |
| **Eye Comfort** | Warm, non-harsh colors that don't strain the eyes during long reading sessions |

---

## Design System

### Core Principle: Reader Comfort First

This blog prioritizes eye comfort above all else. Readers should be able to spend hours reading without eye strain. This means:

- **No pure white backgrounds** - Warm, off-white tones reduce glare
- **No pure black text** - Soft black is easier on the eyes
- **Generous spacing** - Whitespace reduces cognitive load
- **Optimal line length** - 65-75 characters per line for readability

### Color Philosophy

The color palette is inspired by aged paper and ink - warm, inviting, and timeless. Think of a well-loved book rather than a sterile digital screen.

### Color Tokens

All colors are centralized in `src/styles/design-tokens.ts` and used throughout the application via Tailwind classes.

#### Light Mode Palette

| Token | Color | Hex | Purpose |
|-------|-------|-----|---------|
| `background` | Warm White | `#FAF9F7` | Main page background |
| `background-subtle` | Cream | `#F5F4F0` | Cards, elevated surfaces |
| `background-muted` | Light Tan | `#EFEEE8` | Hover states, secondary areas |
| `foreground` | Soft Black | `#1A1A1A` | Primary text |
| `foreground-muted` | Dark Gray | `#6B6B6B` | Secondary text, captions |
| `foreground-subtle` | Medium Gray | `#9A9A9A` | Placeholders, hints |
| `accent` | Blue | `#2563EB` | Links, primary actions |
| `accent-hover` | Dark Blue | `#1D4ED8` | Hover state for accent |
| `accent-muted` | Light Blue | `#DBEAFE` | Accent backgrounds, tags |
| `border` | Warm Gray | `#E5E4DF` | Dividers, card borders |
| `success` | Green | `#16A34A` | Success messages |
| `warning` | Amber | `#CA8A04` | Warning messages |
| `error` | Red | `#DC2626` | Error messages |

#### Dark Mode Palette

| Token | Color | Hex | Purpose |
|-------|-------|-----|---------|
| `background` | Charcoal | `#1C1C1E` | Main page background |
| `background-subtle` | Dark Gray | `#2C2C2E` | Cards, elevated surfaces |
| `background-muted` | Medium Gray | `#3A3A3C` | Hover states |
| `foreground` | Off White | `#F5F5F5` | Primary text |
| `foreground-muted` | Light Gray | `#A1A1A1` | Secondary text |
| `foreground-subtle` | Gray | `#6B6B6B` | Placeholders, hints |
| `accent` | Light Blue | `#60A5FA` | Links, primary actions |
| `accent-hover` | Lighter Blue | `#93C5FD` | Hover state for accent |
| `accent-muted` | Dark Blue | `#1E3A5F` | Accent backgrounds |
| `border` | Dark Gray | `#3A3A3C` | Dividers, card borders |

### Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2.5rem (40px) | 700 | 1.2 |
| H2 | 2rem (32px) | 600 | 1.3 |
| H3 | 1.5rem (24px) | 600 | 1.4 |
| H4 | 1.25rem (20px) | 600 | 1.4 |
| Body | 1.125rem (18px) | 400 | 1.7 |
| Small | 0.875rem (14px) | 400 | 1.5 |
| Caption | 0.75rem (12px) | 400 | 1.4 |

### Spacing Scale

Using a consistent 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing |
| `space-2` | 8px | Element padding |
| `space-3` | 12px | Small gaps |
| `space-4` | 16px | Standard padding |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large gaps |
| `space-12` | 48px | Section margins |
| `space-16` | 64px | Page sections |

### Component Patterns

#### Cards
```
- Background: background-subtle
- Border: 1px border (border color)
- Border radius: 8px (rounded-lg)
- Padding: space-6 (24px)
- Shadow: subtle, warm-toned shadow
```

#### Buttons
```
Primary:
- Background: accent
- Text: white
- Hover: accent-hover
- Padding: space-3 horizontal, space-2 vertical

Secondary:
- Background: background-muted
- Text: foreground
- Border: 1px border
- Hover: darken background slightly
```

#### Input Fields
```
- Background: background (light mode) / background-subtle (dark mode)
- Border: 1px border
- Focus: accent border, subtle accent shadow
- Padding: space-3
- Border radius: 6px
```

### Design File Structure

```
src/
├── styles/
│   ├── design-tokens.ts     # Color, spacing, typography definitions
│   └── animations.ts        # Reusable animations
├── app/
│   └── globals.css          # CSS custom properties, base styles
├── components/
│   └── ui/                   # shadcn/ui components (themed)
└── tailwind.config.ts       # Tailwind theme extension from tokens
```

### Implementation Rules

1. **Always use tokens** - Never hardcode hex values in components
2. **Semantic naming** - Use `text-foreground-muted` not `text-gray-500`
3. **Dark mode aware** - All colors automatically switch with theme
4. **Consistency** - Same spacing and sizing across all components
5. **Accessibility** - Maintain WCAG AA contrast ratios (4.5:1 minimum)

### Example Component

```tsx
// Good - uses design tokens
<article className="bg-background-subtle border border-border rounded-lg p-6">
  <h2 className="text-foreground text-2xl font-semibold mb-4">
    {title}
  </h2>
  <p className="text-foreground-muted leading-relaxed">
    {excerpt}
  </p>
  <a href={url} className="text-accent hover:text-accent-hover">
    Read more
  </a>
</article>

// Bad - hardcoded colors
<article className="bg-white border border-gray-200 rounded-lg p-6">
  <h2 className="text-black text-2xl font-semibold mb-4">
    {title}
  </h2>
</article>
```

---

## Core Features

### 1. Blog Posts / Articles

| Feature | Description | Priority |
|---------|-------------|----------|
| Create/Edit/Delete posts | Full CRUD operations for blog content | Must Have |
| Draft mode | Save work-in-progress without publishing | Must Have |
| Scheduled publishing | Set future publish date/time | Should Have |
| Post revisions | Track changes and restore previous versions | Should Have |
| Featured posts | Pin important posts to homepage | Should Have |
| Post series | Group related posts as a series/collection | Nice to Have |
| Reading time estimate | Auto-calculate based on word count | Should Have |
| Table of contents | Auto-generated from headings | Should Have |

### 2. Content Organization

| Feature | Description | Priority |
|---------|-------------|----------|
| Categories | Hierarchical organization (Life, Tech, Travel, etc.) | Must Have |
| Tags | Flexible tagging for cross-cutting topics | Must Have |
| Archives | Browse by month/year | Should Have |
| Search | Full-text search across all content | Must Have |
| Related posts | Suggest similar content | Should Have |
| Custom sorting | Order posts by date, popularity, or manual order | Should Have |

### 3. Static Pages

| Page | Purpose | Priority |
|------|---------|----------|
| Homepage | Featured content, recent posts, welcome message | Must Have |
| About Me | Personal bio, story, contact info | Must Have |
| Contact | Contact form with email notification | Must Have |
| Archive | Complete post listing with filters | Should Have |
| Now | What I'm currently working on/thinking about | Nice to Have |
| Uses | Tools, software, gear I use | Nice to Have |
| Colophon | How the blog was built | Nice to Have |

---

## Content Management

### Post Structure

```
Post
├── Title (required)
├── Slug (auto-generated, editable)
├── Excerpt/Summary (manual or auto-extracted)
├── Content (rich text with embedded media)
├── Featured Image (main image for cards/social)
├── Gallery (additional images)
├── Category (single, required)
├── Tags (multiple, optional)
├── Author (linked user)
├── Status (draft, published, archived)
├── Publish Date (manual or auto)
├── Last Modified Date
├── SEO Fields
│   ├── Meta Title
│   ├── Meta Description
│   └── Social Image
└── Settings
    ├── Allow Comments (boolean)
    ├── Featured (boolean)
    └── Series (optional link)
```

### Post Statuses

| Status | Description | Visibility |
|--------|-------------|------------|
| `DRAFT` | Work in progress | Author only |
| `SCHEDULED` | Set to publish at future date | Author only |
| `PUBLISHED` | Live and visible | Public |
| `ARCHIVED` | Hidden but preserved | Author only |
| `PRIVATE` | Published but not listed | Direct link only |

### Content Types (Future)

- **Article** - Long-form written content
- **Photo Post** - Image-focused with minimal text
- **Quote** - Short quote or thought
- **Link** - Sharing external content with commentary
- **Video** - Embedded video content

---

## Rich Text Editor

### Editor: Tiptap

Using Tiptap for a powerful, extensible rich text editing experience.

### Text Formatting

| Feature | Shortcut | Priority |
|---------|----------|----------|
| Bold | Ctrl+B | Must Have |
| Italic | Ctrl+I | Must Have |
| Underline | Ctrl+U | Must Have |
| Strikethrough | Ctrl+Shift+S | Should Have |
| Highlight/Mark | - | Should Have |
| Superscript | - | Nice to Have |
| Subscript | - | Nice to Have |

### Block Elements

| Feature | Description | Priority |
|---------|-------------|----------|
| Paragraphs | Standard text blocks | Must Have |
| Headings | H1-H6 with hierarchy | Must Have |
| Blockquotes | Styled quote blocks | Must Have |
| Code blocks | Syntax highlighted code | Must Have |
| Bullet lists | Unordered lists | Must Have |
| Numbered lists | Ordered lists | Must Have |
| Task lists | Checkboxes for lists | Nice to Have |
| Horizontal rules | Visual separators | Should Have |
| Tables | Data tables with formatting | Should Have |

### Embeds & Media

| Feature | Description | Priority |
|---------|-------------|----------|
| Images | Inline images with captions | Must Have |
| Image galleries | Multiple images in grid/carousel | Should Have |
| YouTube/Vimeo | Video embeds | Should Have |
| Twitter/X embeds | Tweet cards | Nice to Have |
| Code snippets | GitHub Gist embeds | Nice to Have |
| iFrames | Generic embed support | Nice to Have |

### Links

| Feature | Description | Priority |
|---------|-------------|----------|
| External links | Open in new tab option | Must Have |
| Internal links | Link to other posts/pages | Must Have |
| Auto-linking | Detect and convert URLs | Should Have |
| Link previews | Show preview card for links | Nice to Have |

### Editor UX

| Feature | Description | Priority |
|---------|-------------|----------|
| Toolbar | Floating or fixed formatting bar | Must Have |
| Slash commands | Type `/` for quick actions | Should Have |
| Keyboard shortcuts | Standard formatting shortcuts | Must Have |
| Drag & drop | Reorder blocks by dragging | Should Have |
| Autosave | Periodic draft saving | Must Have |
| Word count | Live word/character count | Should Have |
| Focus mode | Distraction-free writing | Nice to Have |
| Markdown support | Parse markdown on paste | Should Have |
| Undo/Redo | Full history support | Must Have |

---

## Media Management

### Image Upload

| Feature | Description | Priority |
|---------|-------------|----------|
| Drag & drop upload | Drop images directly into editor | Must Have |
| Multi-file upload | Upload multiple images at once | Must Have |
| Click to upload | Traditional file picker | Must Have |
| Paste from clipboard | Paste screenshots directly | Should Have |
| URL import | Import from external URL | Nice to Have |
| Progress indicator | Show upload progress | Should Have |

### Image Processing (Sharp)

| Feature | Description | Priority |
|---------|-------------|----------|
| Auto-resize | Create multiple sizes (thumbnail, medium, large, original) | Must Have |
| Compression | Optimize file size with quality settings | Must Have |
| Format conversion | Convert to WebP for modern browsers | Should Have |
| EXIF stripping | Remove metadata for privacy | Should Have |
| Lazy loading | Load images on scroll | Must Have |
| Blur placeholder | Show blurred preview while loading | Nice to Have |

### Image Sizes

| Size | Dimensions | Use Case |
|------|------------|----------|
| Thumbnail | 150x150 | Admin thumbnails |
| Small | 320px wide | Mobile inline |
| Medium | 640px wide | Content images |
| Large | 1024px wide | Featured images |
| Full | 1920px wide | Full-screen galleries |
| Original | As uploaded | Download option |

### Media Library

| Feature | Description | Priority |
|---------|-------------|----------|
| Gallery view | Grid of all uploaded media | Should Have |
| Search/filter | Find media by name, date, type | Should Have |
| Bulk actions | Delete multiple, add to post | Should Have |
| Usage tracking | See which posts use an image | Nice to Have |
| Alt text management | Edit alt text for accessibility | Must Have |
| Storage stats | Show disk usage | Nice to Have |

### Image Display Options

| Feature | Description | Priority |
|---------|-------------|----------|
| Alignment | Left, center, right, full-width | Must Have |
| Captions | Text below images | Must Have |
| Lightbox | Click to view full size | Should Have |
| Gallery layouts | Grid, masonry, carousel | Should Have |
| Image links | Link image to URL | Should Have |

---

## Comments System

### Comment Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Threaded replies | Nested comment conversations | Must Have |
| Reply notifications | Email when someone replies | Should Have |
| Edit own comments | Time-limited editing | Should Have |
| Delete own comments | Remove your own comments | Should Have |
| Like/react | Simple reactions to comments | Nice to Have |
| Markdown support | Basic formatting in comments | Should Have |
| Mentions | Tag other commenters with @ | Nice to Have |

### Comment Display

| Feature | Description | Priority |
|---------|-------------|----------|
| Chronological order | Oldest or newest first | Must Have |
| Author highlighting | Highlight blog owner's replies | Should Have |
| Gravatar support | Show user avatars | Should Have |
| Comment count | Show number on post cards | Must Have |
| Load more | Paginate long comment threads | Should Have |

### Comment Authentication

| Option | Description | Priority |
|--------|-------------|----------|
| Registered users only | Require account to comment | Must Have |
| Guest comments | Allow name/email without account | Nice to Have |
| Social login | Comment via Google/GitHub | Should Have |

### Moderation

| Feature | Description | Priority |
|---------|-------------|----------|
| Approval queue | Review comments before publishing | Must Have |
| Auto-approve | Trust returning commenters | Should Have |
| Spam detection | Basic spam filtering | Should Have |
| Blocklist | Block specific words/emails | Should Have |
| Bulk moderation | Approve/delete multiple | Should Have |
| Report comment | Let users flag inappropriate content | Nice to Have |
| Comment status | Pending, approved, spam, trash | Must Have |

### Comment Notifications

| Notification | Recipient | Priority |
|--------------|-----------|----------|
| New comment | Post author | Must Have |
| Reply to comment | Original commenter | Should Have |
| Comment approved | Commenter (if moderated) | Nice to Have |
| Pending comments | Admin digest | Should Have |

---

## Subscription & Distribution

### Email Subscriptions

| Feature | Description | Priority |
|---------|-------------|----------|
| Subscribe form | Email capture with opt-in | Must Have |
| Double opt-in | Confirm email address | Must Have |
| Unsubscribe link | One-click unsubscribe | Must Have |
| Subscriber list | View/manage subscribers | Must Have |
| Subscription preferences | Choose what to receive | Nice to Have |
| Welcome email | Send on new subscription | Should Have |

### Newsletter

| Feature | Description | Priority |
|---------|-------------|----------|
| New post notifications | Auto-email on publish | Should Have |
| Custom newsletters | Write standalone emails | Nice to Have |
| Email templates | Branded email design | Should Have |
| Send preview | Test before sending | Should Have |
| Send history | Track sent emails | Should Have |
| Open/click tracking | Basic analytics (privacy-respecting) | Nice to Have |

### RSS Feeds

| Feed | URL | Priority |
|------|-----|----------|
| Main feed | `/feed.xml` or `/rss` | Must Have |
| Category feeds | `/category/[slug]/feed` | Should Have |
| Tag feeds | `/tag/[slug]/feed` | Nice to Have |
| Comments feed | `/comments/feed` | Nice to Have |
| JSON Feed | `/feed.json` | Nice to Have |
| Atom feed | `/atom.xml` | Nice to Have |

### RSS Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Full content | Include complete post in feed | Must Have |
| Featured image | Include in feed items | Should Have |
| Author info | Include author details | Should Have |
| Categories/tags | Include taxonomy in items | Should Have |
| Autodiscovery | Link tags in HTML head | Must Have |
| Custom feed title | Branded feed name | Should Have |
| Feed validation | Ensure valid RSS/Atom | Must Have |

### Social Sharing

| Feature | Description | Priority |
|---------|-------------|----------|
| Share buttons | Twitter, Facebook, LinkedIn, etc. | Should Have |
| Copy link | Quick link copying | Must Have |
| Native share | Use device share sheet on mobile | Nice to Have |
| Social meta tags | OpenGraph, Twitter Cards | Must Have |
| Share images | Auto-generate social images | Nice to Have |

---

## User Experience

### Reading Experience

| Feature | Description | Priority |
|---------|-------------|----------|
| Clean typography | Readable fonts and spacing | Must Have |
| Responsive design | Works on all devices | Must Have |
| Dark mode | Toggle between light/dark | Should Have |
| Reading progress | Progress bar on posts | Nice to Have |
| Estimated read time | Show at top of posts | Should Have |
| Font size control | Adjust text size | Nice to Have |
| Print stylesheet | Clean printing of posts | Nice to Have |

### Navigation

| Feature | Description | Priority |
|---------|-------------|----------|
| Header menu | Main navigation | Must Have |
| Footer links | Secondary navigation | Must Have |
| Breadcrumbs | Show current location | Should Have |
| Previous/next | Navigate between posts | Should Have |
| Back to top | Scroll to top button | Should Have |
| Keyboard navigation | Navigate with keyboard | Nice to Have |

### Search

| Feature | Description | Priority |
|---------|-------------|----------|
| Full-text search | Search post content | Must Have |
| Search suggestions | Autocomplete as you type | Nice to Have |
| Search filters | Filter by category, tag, date | Should Have |
| Search highlighting | Highlight matches in results | Should Have |
| No results state | Helpful message when no matches | Must Have |
| Recent searches | Show search history | Nice to Have |

### Accessibility (a11y)

| Feature | Description | Priority |
|---------|-------------|----------|
| Semantic HTML | Proper heading hierarchy, landmarks | Must Have |
| Alt text | All images have descriptions | Must Have |
| Keyboard accessible | All features usable without mouse | Must Have |
| Screen reader support | ARIA labels where needed | Must Have |
| Color contrast | WCAG AA compliant | Must Have |
| Focus indicators | Visible focus states | Must Have |
| Skip links | Skip to main content | Should Have |
| Reduced motion | Respect prefers-reduced-motion | Should Have |

---

## Admin Dashboard

### Dashboard Overview

| Widget | Description | Priority |
|--------|-------------|----------|
| Quick stats | Posts, comments, subscribers count | Must Have |
| Recent activity | Latest comments, new subscribers | Should Have |
| Quick actions | New post, view site, settings | Must Have |
| Draft posts | List of unpublished work | Should Have |
| Pending comments | Comments awaiting moderation | Should Have |

### Post Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Post list | Table view with sorting/filtering | Must Have |
| Quick edit | Edit title, status, category inline | Should Have |
| Bulk actions | Delete, change status, category | Should Have |
| Search posts | Find posts quickly | Must Have |
| Filter by status | Show only drafts, published, etc. | Must Have |
| Filter by category | Show posts in category | Should Have |
| Export posts | Download as JSON/Markdown | Nice to Have |

### User Management

| Feature | Description | Priority |
|---------|-------------|----------|
| User list | View all registered users | Must Have |
| Role management | Change user roles | Must Have |
| User activity | See user's posts, comments | Should Have |
| Ban/suspend | Block problematic users | Should Have |
| Invite users | Send registration invite | Nice to Have |

### Settings

| Section | Options | Priority |
|---------|---------|----------|
| General | Site title, tagline, timezone | Must Have |
| Writing | Default category, post format | Should Have |
| Reading | Posts per page, feed settings | Should Have |
| Comments | Moderation settings, auto-approve | Must Have |
| Media | Upload limits, image sizes | Should Have |
| SEO | Default meta, social accounts | Should Have |
| Email | SMTP settings, templates | Should Have |
| Appearance | Theme options, logo upload | Should Have |

---

## SEO & Discovery

### On-Page SEO

| Feature | Description | Priority |
|---------|-------------|----------|
| Meta titles | Custom or auto-generated | Must Have |
| Meta descriptions | Custom or auto-excerpted | Must Have |
| Canonical URLs | Prevent duplicate content | Must Have |
| Structured data | JSON-LD for articles, author | Should Have |
| Open Graph tags | Facebook/LinkedIn sharing | Must Have |
| Twitter Cards | Twitter sharing preview | Must Have |
| Robots meta | Control indexing per page | Should Have |

### Technical SEO

| Feature | Description | Priority |
|---------|-------------|----------|
| XML Sitemap | Auto-generated, submitted to Google | Must Have |
| Robots.txt | Control crawler access | Must Have |
| Clean URLs | Semantic, readable slugs | Must Have |
| 301 redirects | Redirect old URLs | Should Have |
| 404 handling | Custom not found page | Must Have |
| Page speed | Optimized loading | Must Have |
| Mobile-friendly | Responsive design | Must Have |
| HTTPS | Secure connections | Must Have |

### Analytics

| Feature | Description | Priority |
|---------|-------------|----------|
| Page views | Track post popularity | Should Have |
| Popular posts | Show most read content | Should Have |
| Referrer tracking | See where traffic comes from | Should Have |
| Search terms | What people search for | Nice to Have |
| Reading depth | How far people scroll | Nice to Have |
| Privacy-first | Self-hosted analytics (Umami/Plausible) | Should Have |

---

## Performance & Security

### Performance

| Feature | Description | Priority |
|---------|-------------|----------|
| Static generation | Pre-render pages at build | Must Have |
| Image optimization | Responsive images, WebP | Must Have |
| Code splitting | Load only needed JS | Must Have |
| Caching | Browser and CDN caching | Should Have |
| Lazy loading | Defer non-critical resources | Should Have |
| Database indexing | Optimize query performance | Must Have |
| Compression | Gzip/Brotli responses | Should Have |

### Security

| Feature | Description | Priority |
|---------|-------------|----------|
| Input validation | Zod schemas for all input | Must Have |
| SQL injection protection | Parameterized queries (Prisma) | Must Have |
| XSS prevention | Sanitize user content | Must Have |
| CSRF protection | Token validation | Must Have |
| Rate limiting | Prevent abuse | Should Have |
| Secure headers | CSP, HSTS, etc. | Should Have |
| Dependency updates | Keep packages updated | Must Have |
| Backup strategy | Regular database backups | Must Have |
| Admin 2FA | Two-factor for admin accounts | Nice to Have |

---

## Future Enhancements

### Content Features

- [ ] Podcast hosting with RSS feed
- [ ] Video uploads and player
- [ ] Markdown files import (from Obsidian, etc.)
- [ ] AI-assisted writing suggestions
- [ ] Grammar/spell checking
- [ ] Content scheduling calendar
- [ ] Post templates

### Community Features

- [ ] Reader accounts with profiles
- [ ] Bookmarking/save for later
- [ ] Reading lists/collections
- [ ] Community posts (user-submitted content)
- [ ] Private/members-only posts
- [ ] Discussion forums

### Monetization (Optional)

- [ ] Donation button (Ko-fi, Buy Me a Coffee)
- [ ] Membership tiers
- [ ] Premium content
- [ ] Sponsorship display

### Multi-platform

- [ ] Mobile app (React Native)
- [ ] Email-to-post (publish via email)
- [ ] API for third-party integrations
- [ ] Webhooks for automation
- [ ] Cross-posting to social media

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Basic project setup and infrastructure

- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS and shadcn/ui
- [ ] Configure Docker Compose for PostgreSQL
- [ ] Set up Prisma with initial schema
- [ ] Create base layout (header, footer, navigation)
- [ ] Implement responsive design foundation
- [ ] Set up development workflow

### Phase 2: Authentication (Week 3)

**Goal:** Secure user authentication system

- [ ] Configure NextAuth.js
- [ ] Implement email/password registration
- [ ] Implement login/logout
- [ ] Add Google OAuth provider
- [ ] Create protected route middleware
- [ ] Build user profile page
- [ ] Implement role-based access control

### Phase 3: Blog Core (Week 4-5)

**Goal:** Full blog post functionality

- [ ] Build blog post listing page
- [ ] Implement individual post view
- [ ] Set up Tiptap rich text editor
- [ ] Add basic text formatting
- [ ] Implement draft/publish workflow
- [ ] Create post management in admin
- [ ] Add categories and tags
- [ ] Implement slug generation
- [ ] Add post search functionality

### Phase 4: Media Management (Week 6)

**Goal:** Complete image upload and management

- [ ] Build image upload API
- [ ] Integrate Sharp for image processing
- [ ] Create multiple image sizes
- [ ] Add drag-and-drop to editor
- [ ] Build media library interface
- [ ] Implement featured images
- [ ] Add image galleries to posts
- [ ] Set up alt text editing

### Phase 5: Static Pages (Week 7)

**Goal:** Essential static pages

- [ ] Create About page with editor
- [ ] Build Contact page with form
- [ ] Implement contact form email
- [ ] Create archive/all posts page
- [ ] Add 404 and error pages
- [ ] Implement page management in admin

### Phase 6: Comments (Week 8)

**Goal:** Full commenting system

- [ ] Build comment submission form
- [ ] Implement threaded replies
- [ ] Create comment moderation queue
- [ ] Add comment status management
- [ ] Build comment notifications
- [ ] Implement spam prevention
- [ ] Add comment count to posts

### Phase 7: Subscriptions (Week 9)

**Goal:** RSS and email subscriptions

- [ ] Generate RSS feed
- [ ] Build subscription form
- [ ] Implement double opt-in
- [ ] Create subscriber management
- [ ] Build unsubscribe flow
- [ ] Add email notifications for new posts
- [ ] Implement RSS autodiscovery

### Phase 8: SEO & Polish (Week 10)

**Goal:** SEO optimization and refinements

- [ ] Add meta tags management
- [ ] Generate XML sitemap
- [ ] Implement Open Graph/Twitter Cards
- [ ] Add structured data (JSON-LD)
- [ ] Implement dark mode toggle
- [ ] Performance optimization
- [ ] Accessibility audit and fixes
- [ ] Security hardening

### Phase 9: Analytics & Launch (Week 11)

**Goal:** Analytics and production deployment

- [ ] Set up self-hosted analytics
- [ ] Build analytics dashboard
- [ ] Configure production database
- [ ] Set up deployment pipeline
- [ ] Configure domain and HTTPS
- [ ] Final testing and QA
- [ ] Launch!

---

## Database Schema Updates

Based on features, the schema should include:

```prisma
// Additional fields for Post
model Post {
  // ... existing fields
  scheduledAt    DateTime?        // For scheduled publishing
  isPrivate      Boolean @default(false)
  allowComments  Boolean @default(true)
  isFeatured     Boolean @default(false)
  readingTime    Int?             // Minutes
  views          Int @default(0)  // View counter

  // SEO fields
  metaTitle      String?
  metaDescription String?
  socialImage    String?

  // Series support
  series         Series?  @relation(fields: [seriesId], references: [id])
  seriesId       String?
  seriesOrder    Int?

  // Multiple images
  images         PostImage[]
}

model PostImage {
  id        String   @id @default(cuid())
  url       String
  alt       String?
  caption   String?
  order     Int      @default(0)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
}

model Series {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String?
  posts       Post[]
}

// Enhanced Media
model Media {
  // ... existing fields
  alt         String?
  caption     String?
  width       Int?
  height      Int?
  thumbnailUrl String?
  mediumUrl   String?
  largeUrl    String?
  usedInPosts Int @default(0)
}

// Newsletter tracking
model Newsletter {
  id          String   @id @default(cuid())
  subject     String
  content     String   @db.Text
  sentAt      DateTime?
  sentCount   Int @default(0)
  openCount   Int @default(0)
  clickCount  Int @default(0)
  createdAt   DateTime @default(now())
}

// Post views tracking
model PostView {
  id        String   @id @default(cuid())
  postId    String
  viewedAt  DateTime @default(now())
  referrer  String?
  userAgent String?
}
```

---

## Success Metrics

### Content Goals

- [ ] Publish at least 1 post per week
- [ ] Build a library of 50+ posts in first year
- [ ] Cover at least 5 distinct categories

### Engagement Goals

- [ ] Grow subscriber list to 100+ readers
- [ ] Average 5+ comments per post
- [ ] 50%+ email open rate

### Technical Goals

- [ ] Lighthouse score 90+ (all categories)
- [ ] Page load under 2 seconds
- [ ] 99.9% uptime

---

## Notes

- Keep the design simple and focused on readability
- Prioritize writing experience to encourage frequent posting
- Remember: this is a "Book of Life" - personal, authentic, lasting
- All features should serve the goal of meaningful content creation and sharing
