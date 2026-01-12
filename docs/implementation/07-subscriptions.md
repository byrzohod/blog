# Phase 7: Subscriptions Implementation

**Status:** Not Started
**Priority:** Medium
**Dependencies:** Phase 1 (Foundation), Phase 5 (Static Pages for email)
**Estimated Tasks:** 14

---

## Overview

Implement email subscriptions and RSS feeds to help readers stay updated with new content. This creates a direct connection with your audience.

---

## Goals

1. Create email subscription with double opt-in
2. Build subscriber management
3. Generate RSS/Atom/JSON feeds
4. Send notifications for new posts
5. Implement unsubscribe functionality

---

## Tasks

### 7.1 Create Subscriber Model

**File:** `prisma/schema.prisma` (update)

```prisma
model Subscriber {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  isVerified    Boolean  @default(false)
  verifyToken   String?  @unique
  subscribedAt  DateTime @default(now())
  verifiedAt    DateTime?
  unsubscribedAt DateTime?

  // Preferences
  notifyNewPosts Boolean @default(true)
  notifyNewsletter Boolean @default(true)

  @@map("subscribers")
}

model Newsletter {
  id          String    @id @default(cuid())
  subject     String
  content     String    @db.Text
  sentAt      DateTime?
  createdAt   DateTime  @default(now())

  @@map("newsletters")
}
```

Run migration:
```bash
npx prisma migrate dev --name add_subscriptions
```

**Acceptance Criteria:**
- [ ] Subscriber model created
- [ ] Newsletter model for tracking sends
- [ ] Unique email constraint

---

### 7.2 Build Subscription Form Component

**File:** `src/components/subscribe/subscribe-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle } from 'lucide-react';

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z.string().optional(),
});

type SubscribeInput = z.infer<typeof subscribeSchema>;

interface SubscribeFormProps {
  showName?: boolean;
  className?: string;
}

export function SubscribeForm({ showName = false, className }: SubscribeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscribeInput>({
    resolver: zodResolver(subscribeSchema),
  });

  async function onSubmit(data: SubscribeInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Subscription failed');
      }

      setIsSuccess(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className={`text-center ${className}`}>
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
        <h3 className="font-semibold mb-2">Check your email!</h3>
        <p className="text-sm text-foreground-muted">
          We've sent you a confirmation link. Click it to complete your subscription.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      {error && (
        <p className="text-sm text-error mb-4">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {showName && (
          <Input
            placeholder="Your name"
            {...register('name')}
            className="flex-1"
          />
        )}
        <Input
          type="email"
          placeholder="your@email.com"
          {...register('email')}
          className="flex-1"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            'Subscribing...'
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Subscribe
            </>
          )}
        </Button>
      </div>

      {errors.email && (
        <p className="text-sm text-error mt-2">{errors.email.message}</p>
      )}
    </form>
  );
}
```

**Acceptance Criteria:**
- [ ] Email input and submit
- [ ] Optional name field
- [ ] Validation errors shown
- [ ] Success message displayed

---

### 7.3 Create Subscription API Endpoint

**File:** `src/app/api/subscribe/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = subscribeSchema.parse(body);

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existing?.isVerified) {
      return NextResponse.json(
        { message: 'Already subscribed' },
        { status: 400 }
      );
    }

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // Create or update subscriber
    await prisma.subscriber.upsert({
      where: { email },
      update: { name, verifyToken },
      create: { email, name, verifyToken },
    });

    // Send verification email
    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/subscribe/verify?token=${verifyToken}`;

    await sendEmail({
      to: email,
      subject: 'Confirm your subscription',
      html: `
        <h2>Welcome to Book of Life!</h2>
        <p>Please confirm your subscription by clicking the link below:</p>
        <p><a href="${verifyUrl}">Confirm Subscription</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('Subscribe error:', error);
    return NextResponse.json(
      { message: 'Subscription failed' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Creates subscriber record
- [ ] Generates unique token
- [ ] Sends verification email
- [ ] Handles existing subscribers

---

### 7.4 Implement Double Opt-in Flow

**File:** `src/app/api/subscribe/verify/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/subscribe/error?reason=missing-token', request.url)
    );
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { verifyToken: token },
  });

  if (!subscriber) {
    return NextResponse.redirect(
      new URL('/subscribe/error?reason=invalid-token', request.url)
    );
  }

  if (subscriber.isVerified) {
    return NextResponse.redirect(
      new URL('/subscribe/already-verified', request.url)
    );
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      isVerified: true,
      verifyToken: null,
      verifiedAt: new Date(),
    },
  });

  return NextResponse.redirect(
    new URL('/subscribe/success', request.url)
  );
}
```

**File:** `src/app/subscribe/success/page.tsx`

```typescript
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscribeSuccessPage() {
  return (
    <div className="container-wide flex flex-col items-center justify-center min-h-[60vh] py-12 text-center">
      <CheckCircle className="h-16 w-16 text-success mb-6" />
      <h1 className="text-3xl font-bold mb-4">You're subscribed!</h1>
      <p className="text-foreground-muted max-w-md mb-8">
        Thank you for subscribing. You'll receive updates when new posts are published.
      </p>
      <Button asChild>
        <Link href="/blog">Browse the Blog</Link>
      </Button>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Token validates subscriber
- [ ] Marks as verified
- [ ] Clears token after use
- [ ] Shows success page

---

### 7.5 Create Email Verification Template

Already implemented in 7.3 with inline HTML. For more complex emails, create templates:

**File:** `src/lib/email-templates.ts`

```typescript
export function getVerificationEmailTemplate(verifyUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Book of Life!</h1>
        <p>Thank you for subscribing to our newsletter. Please confirm your subscription by clicking the button below:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" class="button">Confirm Subscription</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
        <div class="footer">
          <p>If you didn't subscribe, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

**Acceptance Criteria:**
- [ ] Professional email design
- [ ] Clear call to action
- [ ] Fallback URL text

---

### 7.6 Build Unsubscribe Functionality

**File:** `src/app/api/unsubscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const token = request.nextUrl.searchParams.get('token');

  if (!email) {
    return NextResponse.redirect(
      new URL('/unsubscribe/error', request.url)
    );
  }

  // Simple unsubscribe (for now, just mark as unsubscribed)
  await prisma.subscriber.update({
    where: { email },
    data: {
      unsubscribedAt: new Date(),
      notifyNewPosts: false,
      notifyNewsletter: false,
    },
  });

  return NextResponse.redirect(
    new URL('/unsubscribe/success', request.url)
  );
}
```

**File:** `src/app/unsubscribe/success/page.tsx`

```typescript
export default function UnsubscribeSuccessPage() {
  return (
    <div className="container-wide flex flex-col items-center justify-center min-h-[60vh] py-12 text-center">
      <h1 className="text-3xl font-bold mb-4">Unsubscribed</h1>
      <p className="text-foreground-muted max-w-md">
        You've been unsubscribed from our mailing list. We're sorry to see you go!
      </p>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] One-click unsubscribe
- [ ] Marks subscriber as unsubscribed
- [ ] Shows confirmation

---

### 7.7 Create Subscriber Management Page

**File:** `src/app/admin/subscribers/page.tsx`

```typescript
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { SubscriberTable } from '@/components/admin/subscriber-table';

export const metadata: Metadata = {
  title: 'Subscribers',
};

export default async function SubscribersPage() {
  const [total, verified, unsubscribed] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { isVerified: true, unsubscribedAt: null } }),
    prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
  ]);

  const subscribers = await prisma.subscriber.findMany({
    orderBy: { subscribedAt: 'desc' },
    take: 100,
  });

  return (
    <div className="container-wide py-8">
      <h1 className="text-3xl font-bold mb-8">Subscribers</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-background-subtle p-4 rounded-lg text-center">
          <p className="text-3xl font-bold">{total}</p>
          <p className="text-sm text-foreground-muted">Total</p>
        </div>
        <div className="bg-success/10 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold">{verified}</p>
          <p className="text-sm text-foreground-muted">Active</p>
        </div>
        <div className="bg-foreground-muted/10 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold">{unsubscribed}</p>
          <p className="text-sm text-foreground-muted">Unsubscribed</p>
        </div>
      </div>

      <SubscriberTable subscribers={subscribers} />
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows subscriber stats
- [ ] Lists all subscribers
- [ ] Can export list
- [ ] Can delete subscribers

---

### 7.8 Generate RSS Feed

**File:** `src/app/feed.xml/route.ts`

```typescript
import { prisma } from '@/lib/db';

export async function GET() {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
    },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Book of Life</title>
    <link>${siteUrl}</link>
    <description>A personal blog sharing thoughts, experiences, and stories.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <pubDate>${post.publishedAt?.toUTCString()}</pubDate>
      <author>${post.author.name}</author>
    </item>`).join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
```

**Acceptance Criteria:**
- [ ] Valid RSS 2.0 format
- [ ] Includes latest posts
- [ ] Full content in feed
- [ ] Proper caching

---

### 7.9 Add RSS Autodiscovery Link

**File:** `src/app/layout.tsx` (update head)

```typescript
export const metadata: Metadata = {
  // ... existing metadata
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};
```

Or in the head:
```html
<link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml" />
```

**Acceptance Criteria:**
- [ ] Browsers detect RSS feed
- [ ] Feed readers can autodiscover

---

### 7.10 Create JSON Feed

**File:** `src/app/feed.json/route.ts`

```typescript
import { prisma } from '@/lib/db';

export async function GET() {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      featuredImage: true,
      author: { select: { name: true } },
      tags: { select: { name: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Book of Life',
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    description: 'A personal blog sharing thoughts, experiences, and stories.',
    language: 'en',
    items: posts.map(post => ({
      id: post.id,
      url: `${siteUrl}/blog/${post.slug}`,
      title: post.title,
      content_html: post.content,
      summary: post.excerpt,
      image: post.featuredImage ? `${siteUrl}${post.featuredImage}` : undefined,
      date_published: post.publishedAt?.toISOString(),
      authors: [{ name: post.author.name }],
      tags: post.tags.map(t => t.name),
    })),
  };

  return Response.json(feed, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
```

**Acceptance Criteria:**
- [ ] Valid JSON Feed format
- [ ] Includes all required fields
- [ ] Proper content encoding

---

### 7.11 Add Category-Specific Feeds

**File:** `src/app/category/[slug]/feed.xml/route.ts`

```typescript
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) {
    notFound();
  }

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      categoryId: category.id,
    },
    // ... rest similar to main feed
  });

  // Generate RSS similar to main feed but for category
}
```

**Acceptance Criteria:**
- [ ] Feed per category
- [ ] Includes category name
- [ ] Only category posts

---

### 7.12 Build New Post Notification System

**File:** `src/lib/notify-subscribers.ts`

```typescript
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function notifySubscribersOfNewPost(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: true },
  });

  if (!post || post.status !== 'PUBLISHED') return;

  const subscribers = await prisma.subscriber.findMany({
    where: {
      isVerified: true,
      unsubscribedAt: null,
      notifyNewPosts: true,
    },
    select: { email: true, name: true },
  });

  const siteUrl = process.env.NEXTAUTH_URL;

  for (const subscriber of subscribers) {
    await sendEmail({
      to: subscriber.email,
      subject: `New Post: ${post.title}`,
      html: `
        <h2>${post.title}</h2>
        <p>${post.excerpt || ''}</p>
        <p><a href="${siteUrl}/blog/${post.slug}">Read more</a></p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          <a href="${siteUrl}/api/unsubscribe?email=${subscriber.email}">Unsubscribe</a>
        </p>
      `,
    });
  }
}
```

Call this when a post is published:
```typescript
// In publishPost server action
await notifySubscribersOfNewPost(postId);
```

**Acceptance Criteria:**
- [ ] Sends to all active subscribers
- [ ] Includes post excerpt
- [ ] Has unsubscribe link

---

### 7.13-7.14 Email Templates and Testing

Create professional email templates and test deliverability.

**File:** `src/lib/email-templates.ts` (extend)

```typescript
export function getNewPostEmailTemplate(post: {
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: string;
}, unsubscribeUrl: string): string {
  const siteUrl = process.env.NEXTAUTH_URL;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        /* Email styles */
      </style>
    </head>
    <body>
      <div class="container">
        ${post.featuredImage ? `<img src="${siteUrl}${post.featuredImage}" alt="${post.title}" />` : ''}
        <h1>${post.title}</h1>
        <p>${post.excerpt}</p>
        <a href="${siteUrl}/blog/${post.slug}" class="button">Read More</a>
        <div class="footer">
          <a href="${unsubscribeUrl}">Unsubscribe</a>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

**Acceptance Criteria:**
- [ ] Emails render correctly
- [ ] Links work
- [ ] Unsubscribe works
- [ ] Not marked as spam

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Add Subscriber model |
| `src/components/subscribe/*.tsx` | Created | Subscribe form |
| `src/app/api/subscribe/route.ts` | Created | Subscribe endpoint |
| `src/app/api/subscribe/verify/route.ts` | Created | Verify endpoint |
| `src/app/api/unsubscribe/route.ts` | Created | Unsubscribe endpoint |
| `src/app/feed.xml/route.ts` | Created | RSS feed |
| `src/app/feed.json/route.ts` | Created | JSON feed |
| `src/app/admin/subscribers/page.tsx` | Created | Subscriber management |
| `src/lib/notify-subscribers.ts` | Created | Notification system |
| `src/lib/email-templates.ts` | Created | Email templates |

---

## Testing Checklist

- [ ] Can subscribe with email
- [ ] Verification email received
- [ ] Clicking link verifies subscriber
- [ ] Cannot double-subscribe
- [ ] Can unsubscribe
- [ ] RSS feed valid
- [ ] JSON feed valid
- [ ] Feed readers can parse feeds
- [ ] New post notifications sent
- [ ] Unsubscribe link works in emails
