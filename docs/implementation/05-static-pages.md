# Phase 5: Static Pages Implementation

**Status:** Not Started
**Priority:** Medium
**Dependencies:** Phase 1 (Foundation), Phase 3 (Blog Core)
**Estimated Tasks:** 12

---

## Overview

Create essential static pages including About, Contact, and Archive pages. These pages provide important context about the blog author and ways to get in touch.

---

## Goals

1. Create Page model for editable static pages
2. Build About page with rich content
3. Create Contact page with functional form
4. Build comprehensive archive/all posts page
5. Create 404 and error pages

---

## Tasks

### 5.1 Create Page Model

**File:** `prisma/schema.prisma` (update)

```prisma
model Page {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     String   @db.Text
  excerpt     String?
  isPublished Boolean  @default(false)

  // SEO
  metaTitle       String?
  metaDescription String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("pages")
}
```

Run migration:
```bash
npx prisma migrate dev --name add_pages_model
```

**Acceptance Criteria:**
- [ ] Page model created
- [ ] Can create/edit pages
- [ ] Unique slug constraint works

---

### 5.2 Build About Page

**File:** `src/app/(public)/about/page.tsx`

```typescript
import { Metadata } from 'next';
import Image from 'next/image';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn more about me and this blog',
};

export default async function AboutPage() {
  // Optionally fetch from pages table for dynamic content
  const page = await prisma.page.findUnique({
    where: { slug: 'about' },
  });

  return (
    <article className="container-prose py-12">
      <header className="text-center mb-12">
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <Image
            src="/images/avatar.jpg"
            alt="Sarkis Haralampiev"
            fill
            className="rounded-full object-cover"
          />
        </div>
        <h1 className="text-4xl font-bold mb-4">About Me</h1>
        <p className="text-xl text-foreground-muted">
          Welcome to my corner of the internet
        </p>
      </header>

      {page?.content ? (
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <div className="prose prose-lg max-w-none">
          <p>
            Hello! I'm Sarkis Haralampiev, and this is my Book of Life -
            a personal blog where I share my thoughts, experiences, and
            stories from my journey through life.
          </p>

          <h2>What You'll Find Here</h2>
          <p>
            This blog covers various topics that matter to me:
          </p>
          <ul>
            <li><strong>Life experiences</strong> - Personal stories and reflections</li>
            <li><strong>Technology</strong> - Programming, tools, and tech adventures</li>
            <li><strong>Travel</strong> - Places I've been and cultures I've experienced</li>
            <li><strong>Thoughts</strong> - Random musings and ideas</li>
          </ul>

          <h2>Why "Book of Life"?</h2>
          <p>
            I believe everyone's life is a book worth reading. This blog is
            my way of documenting chapters of my own story, in hopes that
            some of my experiences might resonate with or help others.
          </p>

          <h2>Connect With Me</h2>
          <p>
            I'd love to hear from you! Feel free to reach out through the
            <a href="/contact">contact page</a>, leave comments on posts,
            or connect on social media.
          </p>
        </div>
      )}
    </article>
  );
}
```

**Acceptance Criteria:**
- [ ] About page accessible at /about
- [ ] Shows profile image
- [ ] Content editable via admin
- [ ] Falls back to default content

---

### 5.3 Create Contact Page Layout

**File:** `src/app/(public)/contact/page.tsx`

```typescript
import { Metadata } from 'next';
import { ContactForm } from '@/components/contact/contact-form';
import { Mail, MessageSquare, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with me',
};

export default function ContactPage() {
  return (
    <div className="container-wide py-12">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-foreground-muted">
            Have a question or just want to say hi? I'd love to hear from you.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 bg-background-subtle rounded-lg">
            <Mail className="h-8 w-8 mx-auto mb-4 text-accent" />
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="text-foreground-muted text-sm">
              hello@example.com
            </p>
          </div>

          <div className="text-center p-6 bg-background-subtle rounded-lg">
            <MessageSquare className="h-8 w-8 mx-auto mb-4 text-accent" />
            <h3 className="font-semibold mb-2">Social</h3>
            <p className="text-foreground-muted text-sm">
              @username on Twitter
            </p>
          </div>

          <div className="text-center p-6 bg-background-subtle rounded-lg">
            <MapPin className="h-8 w-8 mx-auto mb-4 text-accent" />
            <h3 className="font-semibold mb-2">Location</h3>
            <p className="text-foreground-muted text-sm">
              Planet Earth
            </p>
          </div>
        </div>

        <div className="bg-background-subtle rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Contact page accessible at /contact
- [ ] Shows contact info
- [ ] Form prominently displayed

---

### 5.4 Build Contact Form

**File:** `src/components/contact/contact-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type ContactInput = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setIsSuccess(true);
      reset();
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
        <p className="text-foreground-muted mb-6">
          Thank you for reaching out. I'll get back to you soon.
        </p>
        <Button onClick={() => setIsSuccess(false)}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-error/10 text-error p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-error text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-error text-sm">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          placeholder="What's this about?"
          {...register('subject')}
        />
        {errors.subject && (
          <p className="text-error text-sm">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Your message..."
          rows={6}
          {...register('message')}
        />
        {errors.message && (
          <p className="text-error text-sm">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
```

**Acceptance Criteria:**
- [ ] Form validates all fields
- [ ] Shows validation errors
- [ ] Shows success message after submit
- [ ] Error handling for failed submission

---

### 5.5 Set Up Email Sending

**File:** `src/lib/email.ts`

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions) {
  const { to, subject, text, html } = options;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    to,
    subject,
    text,
    html,
  });
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

  await sendEmail({
    to: adminEmail,
    subject: `[Contact Form] ${data.subject}`,
    text: `
New contact form submission:

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}
    `,
    html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${data.name}</p>
<p><strong>Email:</strong> ${data.email}</p>
<p><strong>Subject:</strong> ${data.subject}</p>
<h3>Message:</h3>
<p>${data.message.replace(/\n/g, '<br>')}</p>
    `,
  });
}
```

**Dependencies:**
```bash
npm install nodemailer
npm install -D @types/nodemailer
```

**Acceptance Criteria:**
- [ ] Email sends successfully
- [ ] Uses configured SMTP
- [ ] Works with Mailpit in dev

---

### 5.6 Create Contact Form API

**File:** `src/app/api/contact/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactEmail } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(20),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    await sendContactEmail(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Validates input
- [ ] Sends email to admin
- [ ] Returns appropriate errors

---

### 5.7 Build Archive Page

**File:** `src/app/(public)/archive/page.tsx`

```typescript
import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Archive',
  description: 'Browse all posts',
};

export default async function ArchivePage() {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
    },
    orderBy: { publishedAt: 'desc' },
  });

  // Group posts by year and month
  const groupedPosts = posts.reduce((acc, post) => {
    const date = new Date(post.publishedAt!);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });

    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = [];
    acc[year][month].push(post);

    return acc;
  }, {} as Record<number, Record<string, typeof posts>>);

  const years = Object.keys(groupedPosts)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="container-wide py-12">
      <h1 className="text-4xl font-bold mb-8">Archive</h1>

      <div className="max-w-3xl">
        {years.map((year) => (
          <div key={year} className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{year}</h2>

            {Object.entries(groupedPosts[year]).map(([month, monthPosts]) => (
              <div key={month} className="mb-8">
                <h3 className="text-lg font-semibold text-foreground-muted mb-4">
                  {month}
                </h3>

                <ul className="space-y-3">
                  {monthPosts.map((post) => (
                    <li key={post.id} className="flex items-baseline gap-4">
                      <time className="text-sm text-foreground-muted w-20 flex-shrink-0">
                        {formatDate(post.publishedAt!, 'MMM d')}
                      </time>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-accent hover:underline"
                      >
                        {post.title}
                      </Link>
                      {post.category && (
                        <span className="text-xs text-foreground-subtle">
                          {post.category.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}

        {posts.length === 0 && (
          <p className="text-foreground-muted">No posts yet.</p>
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Lists all published posts
- [ ] Grouped by year and month
- [ ] Links to individual posts
- [ ] Shows category

---

### 5.8-5.10 Archive Filtering

Add URL params for filtering:

```typescript
// src/app/(public)/archive/page.tsx
interface ArchivePageProps {
  searchParams: {
    category?: string;
    tag?: string;
    year?: string;
  };
}

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const where = {
    status: 'PUBLISHED' as const,
    publishedAt: { lte: new Date() },
    ...(searchParams.category && { category: { slug: searchParams.category } }),
    ...(searchParams.tag && { tags: { some: { slug: searchParams.tag } } }),
    ...(searchParams.year && {
      publishedAt: {
        gte: new Date(`${searchParams.year}-01-01`),
        lt: new Date(`${Number(searchParams.year) + 1}-01-01`),
      },
    }),
  };

  // ... rest of component with filters UI
}
```

**Acceptance Criteria:**
- [ ] Can filter by category
- [ ] Can filter by tag
- [ ] Can filter by year
- [ ] Filters combinable

---

### 5.11 Create 404 Page

**File:** `src/app/not-found.tsx`

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-wide flex flex-col items-center justify-center min-h-[60vh] py-12 text-center">
      <h1 className="text-9xl font-bold text-foreground-muted mb-4">404</h1>
      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="text-foreground-muted max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
        Let's get you back on track.
      </p>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/blog">
            <Search className="mr-2 h-4 w-4" />
            Browse Blog
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows for non-existent routes
- [ ] Provides helpful navigation
- [ ] Matches site design

---

### 5.12 Create Error Page

**File:** `src/app/error.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container-wide flex flex-col items-center justify-center min-h-[60vh] py-12 text-center">
      <h1 className="text-6xl font-bold text-error mb-4">Oops!</h1>
      <h2 className="text-3xl font-bold mb-4">Something went wrong</h2>
      <p className="text-foreground-muted max-w-md mb-8">
        An unexpected error occurred. Please try again or go back to the home page.
      </p>

      <div className="flex gap-4">
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button variant="outline" asChild>
          <a href="/">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </a>
        </Button>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Catches runtime errors
- [ ] Provides retry option
- [ ] Logs errors
- [ ] User-friendly message

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Add Page model |
| `src/lib/email.ts` | Created | Email utilities |
| `src/app/(public)/about/page.tsx` | Created | About page |
| `src/app/(public)/contact/page.tsx` | Created | Contact page |
| `src/app/(public)/archive/page.tsx` | Created | Archive page |
| `src/app/api/contact/route.ts` | Created | Contact API |
| `src/components/contact/*.tsx` | Created | Contact form |
| `src/app/not-found.tsx` | Created | 404 page |
| `src/app/error.tsx` | Created | Error page |

---

## Dependencies

```json
{
  "dependencies": {
    "nodemailer": "^6.x"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.x"
  }
}
```

---

## Testing Checklist

- [ ] About page displays correctly
- [ ] Contact form validates input
- [ ] Contact form sends email
- [ ] Email received in Mailpit
- [ ] Archive shows all posts
- [ ] Archive filters work
- [ ] 404 page shows for bad routes
- [ ] Error page catches errors
