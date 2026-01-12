# Phase 9: SEO & Polish Implementation

**Status:** Not Started
**Priority:** High
**Dependencies:** All previous phases
**Estimated Tasks:** 18

---

## Overview

Final polish phase focusing on SEO optimization, accessibility, performance, and analytics. This ensures the blog is discoverable, accessible, and fast.

---

## Goals

1. Implement comprehensive SEO (meta tags, structured data, sitemap)
2. Add dark mode toggle
3. Ensure accessibility compliance
4. Optimize performance
5. Set up privacy-friendly analytics

---

## Tasks

### 9.1 Add Meta Tags to All Pages

**File:** `src/lib/metadata.ts`

```typescript
import { Metadata } from 'next';

const siteConfig = {
  name: 'Book of Life',
  description: 'A personal blog sharing thoughts, experiences, and stories.',
  url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  author: 'Sarkis Haralampiev',
  twitter: '@username',
};

export function generateMetadata({
  title,
  description,
  image,
  noIndex = false,
}: {
  title: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const fullTitle = title === siteConfig.name
    ? title
    : `${title} | ${siteConfig.name}`;

  return {
    title: fullTitle,
    description: description || siteConfig.description,
    authors: [{ name: siteConfig.author }],
    openGraph: {
      title: fullTitle,
      description: description || siteConfig.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: image ? [{ url: image }] : undefined,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description || siteConfig.description,
      images: image ? [image] : undefined,
      creator: siteConfig.twitter,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
```

**Acceptance Criteria:**
- [ ] All pages have meta tags
- [ ] Consistent formatting
- [ ] Fallback to defaults

---

### 9.2 Create Dynamic Meta for Posts

**File:** `src/app/(public)/blog/[slug]/page.tsx` (update)

```typescript
import { Metadata } from 'next';
import { prisma } from '@/lib/db';

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: {
      title: true,
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
      featuredImage: true,
      author: { select: { name: true } },
      publishedAt: true,
    },
  });

  if (!post) {
    return { title: 'Post Not Found' };
  }

  const siteUrl = process.env.NEXTAUTH_URL;
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || '';
  const image = post.featuredImage
    ? `${siteUrl}${post.featuredImage}`
    : undefined;

  return {
    title,
    description,
    authors: [{ name: post.author.name || 'Author' }],
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name || 'Author'],
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
```

**Acceptance Criteria:**
- [ ] Post title in meta
- [ ] Post excerpt as description
- [ ] Featured image for social
- [ ] Author info included

---

### 9.3 Generate XML Sitemap

**File:** `src/app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Static pages
  const staticPages = [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/blog`, lastModified: new Date() },
    { url: `${siteUrl}/about`, lastModified: new Date() },
    { url: `${siteUrl}/contact`, lastModified: new Date() },
    { url: `${siteUrl}/archive`, lastModified: new Date() },
  ];

  // Blog posts
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
  });

  const postPages = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
  }));

  // Categories
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  const categoryPages = categories.map((cat) => ({
    url: `${siteUrl}/blog?category=${cat.slug}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...postPages, ...categoryPages];
}
```

**Acceptance Criteria:**
- [ ] Sitemap at /sitemap.xml
- [ ] Includes all public pages
- [ ] Includes all posts
- [ ] Valid XML format

---

### 9.4 Create robots.txt

**File:** `src/app/robots.ts`

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/register'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

**Acceptance Criteria:**
- [ ] robots.txt at root
- [ ] Allows public pages
- [ ] Disallows admin/auth
- [ ] Links to sitemap

---

### 9.5 Add Open Graph Tags

Already implemented in 9.1 and 9.2. Ensure all pages have OG tags:

```typescript
openGraph: {
  title,
  description,
  url,
  siteName: 'Book of Life',
  images: [{ url: imageUrl, width: 1200, height: 630 }],
  locale: 'en_US',
  type: 'website', // or 'article' for posts
}
```

**Acceptance Criteria:**
- [ ] OG tags on all pages
- [ ] Images sized correctly
- [ ] Preview works on Facebook

---

### 9.6 Add Twitter Card Tags

Already implemented. Ensure proper card type:

```typescript
twitter: {
  card: 'summary_large_image',
  title,
  description,
  images: [imageUrl],
  creator: '@username',
  site: '@username',
}
```

**Acceptance Criteria:**
- [ ] Twitter cards work
- [ ] Large image card used
- [ ] Creator attributed

---

### 9.7 Implement JSON-LD Structured Data

**File:** `src/components/seo/json-ld.tsx`

```typescript
interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  images: string[];
  datePublished: string;
  dateModified: string;
  author: {
    name: string;
    url?: string;
  };
}

export function ArticleJsonLd(props: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: props.title,
    description: props.description,
    url: props.url,
    image: props.images,
    datePublished: props.datePublished,
    dateModified: props.dateModified,
    author: {
      '@type': 'Person',
      name: props.author.name,
      url: props.author.url,
    },
    publisher: {
      '@type': 'Person',
      name: 'Sarkis Haralampiev',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Book of Life',
    url: process.env.NEXTAUTH_URL,
    description: 'A personal blog sharing thoughts, experiences, and stories.',
    author: {
      '@type': 'Person',
      name: 'Sarkis Haralampiev',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

Add to post page:
```tsx
<ArticleJsonLd
  title={post.title}
  description={post.excerpt || ''}
  url={`${siteUrl}/blog/${post.slug}`}
  images={post.featuredImage ? [`${siteUrl}${post.featuredImage}`] : []}
  datePublished={post.publishedAt?.toISOString() || ''}
  dateModified={post.updatedAt.toISOString()}
  author={{ name: post.author.name || 'Author' }}
/>
```

**Acceptance Criteria:**
- [ ] JSON-LD on all pages
- [ ] Valid schema
- [ ] Rich results in Google

---

### 9.8 Set Up Canonical URLs

**File:** `src/app/layout.tsx` (or per page)

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: './',
  },
};
```

For dynamic pages:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
  };
}
```

**Acceptance Criteria:**
- [ ] Canonical on all pages
- [ ] Prevents duplicate content

---

### 9.9 Implement Dark Mode Toggle

Already partially implemented in Phase 0. Ensure:

**File:** `src/components/theme-toggle.tsx`

```typescript
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-9 h-9" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Acceptance Criteria:**
- [ ] Toggle works
- [ ] System preference option
- [ ] No flash on load
- [ ] Persists preference

---

### 9.10 Add Reading Progress Indicator

**File:** `src/components/blog/reading-progress.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(progress);
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50">
      <div
        className="h-full bg-accent transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
```

Add to post page layout.

**Acceptance Criteria:**
- [ ] Progress bar shows on scroll
- [ ] Smooth animation
- [ ] Works on all posts

---

### 9.11 Create Skip Navigation Links

**File:** `src/components/layout/skip-link.tsx`

```typescript
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded"
    >
      Skip to main content
    </a>
  );
}
```

Add to layout:
```tsx
<body>
  <SkipLink />
  {/* ... */}
  <main id="main-content">
    {children}
  </main>
</body>
```

**Acceptance Criteria:**
- [ ] Skip link visible on focus
- [ ] Jumps to main content
- [ ] Works with keyboard

---

### 9.12 Audit and Fix Accessibility Issues

Run accessibility audit and fix issues:

**Checklist:**
- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators visible
- [ ] Heading hierarchy correct (h1, h2, h3...)
- [ ] Form labels associated with inputs
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Screen reader tested

**Tools:**
- Lighthouse accessibility audit
- axe DevTools extension
- WAVE evaluation tool

**Acceptance Criteria:**
- [ ] Lighthouse accessibility 90+
- [ ] No critical issues
- [ ] Keyboard fully navigable

---

### 9.13 Optimize Images and Assets

**Image Optimization:**
- Already using Sharp for processing
- Next.js Image component for lazy loading
- WebP format for smaller files

**Additional optimizations:**
```typescript
// next.config.js
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

**Acceptance Criteria:**
- [ ] Images in modern formats
- [ ] Responsive image sizes
- [ ] Lazy loading works

---

### 9.14 Configure Caching Headers

**File:** `next.config.js`

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.woff2',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

**Acceptance Criteria:**
- [ ] Static assets cached
- [ ] Images cached long-term
- [ ] HTML not over-cached

---

### 9.15 Run Lighthouse Audit

Run Lighthouse and aim for:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

**Common fixes:**
- Reduce JavaScript bundle size
- Optimize Largest Contentful Paint
- Fix Cumulative Layout Shift
- Add missing meta tags

**Acceptance Criteria:**
- [ ] All scores 90+
- [ ] No critical issues

---

### 9.16 Set Up Self-Hosted Analytics

**Option 1: Umami**

```bash
# docker-compose.yml
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    ports:
      - '3001:3000'
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/umami
    depends_on:
      - db
```

**File:** `src/components/analytics.tsx`

```typescript
import Script from 'next/script';

export function Analytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <Script
      src={process.env.NEXT_PUBLIC_UMAMI_URL}
      data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
      strategy="lazyOnload"
    />
  );
}
```

Add to layout.

**Option 2: Plausible (self-hosted)**

Similar setup with Plausible Community Edition.

**Acceptance Criteria:**
- [ ] Analytics tracking works
- [ ] Dashboard accessible
- [ ] Privacy-friendly (no cookies)

---

### 9.17 Final Cross-Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Mobile Chrome (Android)

**Checklist:**
- [ ] Layout renders correctly
- [ ] Fonts load properly
- [ ] Images display
- [ ] Forms work
- [ ] Dark mode works
- [ ] Animations smooth

**Acceptance Criteria:**
- [ ] No visual bugs
- [ ] All features work
- [ ] Responsive on mobile

---

### 9.18 Performance Optimization

**Bundle Analysis:**
```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**Optimizations:**
- Dynamic imports for heavy components
- Minimize client-side JavaScript
- Use Server Components where possible
- Implement ISR for blog posts

**Acceptance Criteria:**
- [ ] Bundle size reasonable
- [ ] First contentful paint < 1.5s
- [ ] Time to interactive < 3s

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/metadata.ts` | Created | Metadata helpers |
| `src/app/sitemap.ts` | Created | Dynamic sitemap |
| `src/app/robots.ts` | Created | robots.txt |
| `src/components/seo/json-ld.tsx` | Created | Structured data |
| `src/components/theme-toggle.tsx` | Modified | Enhanced toggle |
| `src/components/blog/reading-progress.tsx` | Created | Progress bar |
| `src/components/layout/skip-link.tsx` | Created | Accessibility |
| `src/components/analytics.tsx` | Created | Analytics script |
| `next.config.js` | Modified | Caching, images |

---

## Testing Checklist

- [ ] Meta tags on all pages
- [ ] OG tags work (test with debuggers)
- [ ] Twitter cards work
- [ ] Sitemap valid
- [ ] robots.txt correct
- [ ] JSON-LD valid (test with Google Rich Results)
- [ ] Dark mode toggle works
- [ ] Reading progress shows
- [ ] Skip link works
- [ ] Accessibility audit passes
- [ ] Lighthouse scores 90+
- [ ] Analytics tracking
- [ ] Cross-browser compatible
- [ ] Performance acceptable

---

## Launch Checklist

Before going live:

- [ ] All features tested
- [ ] Database migrated to production
- [ ] Environment variables set
- [ ] Domain configured
- [ ] SSL/HTTPS enabled
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Error tracking enabled
- [ ] Analytics working
- [ ] RSS feed valid
- [ ] First content created
- [ ] About page complete
- [ ] Contact form tested
