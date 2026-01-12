# Phase 3: Blog Core Implementation

**Status:** Not Started
**Priority:** Critical
**Dependencies:** Phase 1 (Foundation), Phase 2 (Authentication)
**Estimated Tasks:** 20

---

## Overview

Implement the core blogging functionality including post creation, rich text editing with Tiptap, categories, tags, and the public blog display. This is the heart of the application.

---

## Goals

1. Create database models for posts, categories, and tags
2. Build the Tiptap rich text editor with essential extensions
3. Implement post listing and individual post pages
4. Create draft/publish workflow
5. Add search functionality

---

## Tasks

### 3.1 Create Post Model in Prisma

**File:** `prisma/schema.prisma` (update)

```prisma
model Post {
  id            String      @id @default(cuid())
  title         String
  slug          String      @unique
  content       String      @db.Text
  excerpt       String?     @db.Text
  featuredImage String?
  status        PostStatus  @default(DRAFT)
  publishedAt   DateTime?
  readingTime   Int?
  views         Int         @default(0)

  // SEO
  metaTitle       String?
  metaDescription String?

  // Settings
  allowComments Boolean @default(true)
  isFeatured    Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  author     User      @relation(fields: [authorId], references: [id])
  authorId   String
  category   Category? @relation(fields: [categoryId], references: [id])
  categoryId String?
  tags       Tag[]
  comments   Comment[]
  images     PostImage[]

  @@index([status, publishedAt])
  @@index([authorId])
  @@index([categoryId])
  @@map("posts")
}

model PostImage {
  id      String  @id @default(cuid())
  url     String
  alt     String?
  caption String?
  order   Int     @default(0)

  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId String

  @@map("post_images")
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

**Acceptance Criteria:**
- [ ] Post model has all required fields
- [ ] Proper indexes for queries
- [ ] Cascade delete for images

---

### 3.2 Create Category Model

```prisma
model Category {
  id          String  @id @default(cuid())
  name        String  @unique
  slug        String  @unique
  description String?
  color       String? // For UI display

  posts Post[]

  @@map("categories")
}
```

**Acceptance Criteria:**
- [ ] Categories have unique names and slugs
- [ ] Optional description and color

---

### 3.3 Create Tag Model with Many-to-Many

```prisma
model Tag {
  id   String @id @default(cuid())
  name String @unique
  slug String @unique

  posts Post[]

  @@map("tags")
}
```

The many-to-many relationship is implicit with Prisma.

**Acceptance Criteria:**
- [ ] Tags can be assigned to multiple posts
- [ ] Posts can have multiple tags

---

### 3.4 Run Database Migrations

```bash
npx prisma migrate dev --name add_blog_models
npx prisma generate
```

**Seed file:** `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default categories
  const categories = [
    { name: 'Life', slug: 'life', description: 'Personal experiences and reflections' },
    { name: 'Tech', slug: 'tech', description: 'Technology and programming' },
    { name: 'Travel', slug: 'travel', description: 'Adventures and explorations' },
    { name: 'Thoughts', slug: 'thoughts', description: 'Random musings and ideas' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Seed creates default categories
- [ ] Database can be queried

---

### 3.5 Build Blog Listing Page

**File:** `src/app/(public)/blog/page.tsx`

```typescript
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { PostCard } from '@/components/blog/post-card';
import { Pagination } from '@/components/blog/pagination';
import { CategoryFilter } from '@/components/blog/category-filter';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read my latest thoughts and articles',
};

interface BlogPageProps {
  searchParams: {
    page?: string;
    category?: string;
  };
}

const POSTS_PER_PAGE = 9;

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const page = Number(searchParams.page) || 1;
  const categorySlug = searchParams.category;

  const where = {
    status: 'PUBLISHED' as const,
    publishedAt: { lte: new Date() },
    ...(categorySlug && { category: { slug: categorySlug } }),
  };

  const [posts, totalPosts, categories] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { name: true, image: true } },
        category: { select: { name: true, slug: true } },
        tags: { select: { name: true, slug: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({
      include: { _count: { select: { posts: true } } },
    }),
  ]);

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  return (
    <div className="container-wide py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      <CategoryFilter
        categories={categories}
        activeCategory={categorySlug}
      />

      {posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath="/blog"
            />
          )}
        </>
      ) : (
        <div className="text-center py-12 text-foreground-muted">
          <p>No posts found.</p>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Lists published posts only
- [ ] Pagination works correctly
- [ ] Category filter works
- [ ] Shows post count

---

### 3.6 Create PostCard Component

**File:** `src/components/blog/post-card.tsx`

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    publishedAt: Date | null;
    readingTime: number | null;
    author: { name: string | null; image: string | null };
    category: { name: string; slug: string } | null;
    tags: { name: string; slug: string }[];
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group bg-background-subtle border border-border rounded-lg overflow-hidden hover:border-accent/50 transition-colors">
      {post.featuredImage && (
        <Link href={`/blog/${post.slug}`}>
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}

      <div className="p-6">
        {post.category && (
          <Link href={`/blog?category=${post.category.slug}`}>
            <Badge variant="secondary" className="mb-3">
              {post.category.name}
            </Badge>
          </Link>
        )}

        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="text-foreground-muted mb-4 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>{post.publishedAt && formatDate(post.publishedAt)}</span>
          {post.readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readingTime} min read
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows featured image
- [ ] Displays category badge
- [ ] Shows reading time
- [ ] Links to full post

---

### 3.7 Create Individual Post Page

**File:** `src/app/(public)/blog/[slug]/page.tsx`

```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Comments } from '@/components/blog/comments';

interface PostPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: { title: true, excerpt: true, metaTitle: true, metaDescription: true },
  });

  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await prisma.post.findUnique({
    where: {
      slug: params.slug,
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
    },
  });

  if (!post) {
    notFound();
  }

  // Increment view count
  await prisma.post.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  });

  return (
    <article className="container-prose py-12">
      {/* Header */}
      <header className="mb-8">
        {post.category && (
          <Badge variant="secondary" className="mb-4">
            {post.category.name}
          </Badge>
        )}

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-foreground-muted">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author.image || undefined} />
              <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
            </Avatar>
            <span>{post.author.name}</span>
          </div>
          <span>&middot;</span>
          <time>{formatDate(post.publishedAt!)}</time>
          {post.readingTime && (
            <>
              <span>&middot;</span>
              <span>{post.readingTime} min read</span>
            </>
          )}
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="aspect-video relative rounded-lg overflow-hidden mb-8">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-lg max-w-none blog-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-border">
          {post.tags.map((tag) => (
            <Badge key={tag.slug} variant="outline">
              #{tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Comments */}
      {post.allowComments && (
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>
          <Comments postId={post.id} />
        </section>
      )}
    </article>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows full post content
- [ ] Displays author info
- [ ] Shows featured image
- [ ] Increments view count
- [ ] Dynamic metadata for SEO

---

### 3.8 Install and Configure Tiptap Editor

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-link @tiptap/extension-image
npm install @tiptap/extension-placeholder @tiptap/extension-code-block-lowlight
npm install lowlight
```

**File:** `src/components/editor/tiptap-editor.tsx`

```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { EditorToolbar } from './editor-toolbar';

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Use CodeBlockLowlight instead
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent hover:underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Editor renders correctly
- [ ] Content updates parent on change
- [ ] Placeholder text shows when empty

---

### 3.9-3.14 Add Editor Extensions

Create toolbar component with buttons for all formatting options.

**File:** `src/components/editor/editor-toolbar.tsx`

```typescript
'use client';

import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-background-subtle">
      {/* Text formatting */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('code')}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        aria-label="Inline code"
      >
        <Code className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet list"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Quote"
      >
        <Quote className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Media */}
      <Toggle
        size="sm"
        pressed={editor.isActive('link')}
        onPressedChange={setLink}
        aria-label="Add link"
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        onPressedChange={addImage}
        aria-label="Add image"
      >
        <ImageIcon className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* History */}
      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </Toggle>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Bold, italic, strikethrough work
- [ ] Headings H1-H3 work
- [ ] Bullet and ordered lists work
- [ ] Blockquotes work
- [ ] Code blocks with syntax highlighting
- [ ] Links can be added
- [ ] Undo/redo work

---

### 3.15 Create Post Editor Page

**File:** `src/app/admin/posts/new/page.tsx`

```typescript
import { Metadata } from 'next';
import { PostEditor } from '@/components/admin/post-editor';

export const metadata: Metadata = {
  title: 'New Post',
};

export default function NewPostPage() {
  return (
    <div className="container-wide py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Post</h1>
      <PostEditor />
    </div>
  );
}
```

**File:** `src/components/admin/post-editor.tsx`

This is a comprehensive form with:
- Title input
- Slug input (auto-generated)
- Category selector
- Tag input
- Featured image upload
- Rich text content editor
- Excerpt textarea
- SEO fields
- Settings (allow comments, featured)
- Save draft / Publish buttons

**Acceptance Criteria:**
- [ ] All fields editable
- [ ] Slug auto-generates from title
- [ ] Can save as draft
- [ ] Can publish directly
- [ ] Validates required fields

---

### 3.16 Implement Draft/Publish Workflow

**File:** `src/app/actions/posts.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-utils';
import { generateSlug, calculateReadingTime } from '@/lib/utils';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  allowComments: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export async function createPost(data: z.infer<typeof postSchema>) {
  const user = await requireRole(['ADMIN', 'AUTHOR']);

  const slug = data.slug || generateSlug(data.title);
  const readingTime = calculateReadingTime(data.content);

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      featuredImage: data.featuredImage,
      categoryId: data.categoryId,
      authorId: user.id,
      readingTime,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      allowComments: data.allowComments,
      isFeatured: data.isFeatured,
      tags: data.tags
        ? {
            connectOrCreate: data.tags.map((tag) => ({
              where: { slug: generateSlug(tag) },
              create: { name: tag, slug: generateSlug(tag) },
            })),
          }
        : undefined,
    },
  });

  revalidatePath('/admin/posts');
  return { success: true, post };
}

export async function publishPost(postId: string) {
  const user = await requireRole(['ADMIN', 'AUTHOR']);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  if (user.role !== 'ADMIN' && post.authorId !== user.id) {
    throw new Error('Not authorized');
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  revalidatePath('/blog');
  revalidatePath('/admin/posts');
  return { success: true };
}

export async function unpublishPost(postId: string) {
  // Similar to publish but sets status to DRAFT
}

export async function deletePost(postId: string) {
  // Delete with authorization check
}
```

**Acceptance Criteria:**
- [ ] Can create draft posts
- [ ] Can publish posts
- [ ] Can unpublish posts
- [ ] Publishing sets publishedAt date
- [ ] Proper authorization checks

---

### 3.17 Add Auto-save Functionality

Implement debounced auto-save in the editor.

```typescript
// In post-editor.tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedSave = useDebouncedCallback(
  async (data) => {
    if (postId) {
      await updatePost(postId, data);
    } else {
      const result = await createPost({ ...data, status: 'DRAFT' });
      setPostId(result.post.id);
    }
    setLastSaved(new Date());
  },
  2000
);

// Call debouncedSave whenever content changes
```

**Acceptance Criteria:**
- [ ] Saves after 2 seconds of inactivity
- [ ] Shows "Last saved" timestamp
- [ ] Creates new post on first save
- [ ] Updates existing post on subsequent saves

---

### 3.18 Create Category Management

**File:** `src/app/admin/categories/page.tsx`

Admin page to:
- List all categories
- Add new category
- Edit category
- Delete category (with post count warning)

**Acceptance Criteria:**
- [ ] Can create categories
- [ ] Can edit name/slug/description
- [ ] Shows post count per category
- [ ] Warns before deleting with posts

---

### 3.19 Create Tag Management

Similar to category management but for tags.

**Acceptance Criteria:**
- [ ] Can create tags
- [ ] Can edit tags
- [ ] Shows usage count
- [ ] Can delete unused tags

---

### 3.20 Implement Post Search

**File:** `src/app/api/search/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ posts: [] });
  }

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
    },
    take: 10,
    orderBy: { publishedAt: 'desc' },
  });

  return NextResponse.json({ posts });
}
```

**File:** `src/components/search/search-dialog.tsx`

Search dialog with:
- Input field
- Debounced search
- Results list
- Keyboard navigation

**Acceptance Criteria:**
- [ ] Search finds posts by title
- [ ] Search finds posts by content
- [ ] Results show quickly (debounced)
- [ ] Clicking result navigates to post

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Add blog models |
| `prisma/seed.ts` | Created | Seed categories |
| `src/app/(public)/blog/page.tsx` | Created | Blog listing |
| `src/app/(public)/blog/[slug]/page.tsx` | Created | Post page |
| `src/components/blog/*.tsx` | Created | Blog components |
| `src/components/editor/*.tsx` | Created | Tiptap editor |
| `src/app/admin/posts/*.tsx` | Created | Post management |
| `src/app/actions/posts.ts` | Created | Server actions |
| `src/app/api/search/route.ts` | Created | Search API |

---

## Dependencies

```json
{
  "dependencies": {
    "@tiptap/react": "^2.x",
    "@tiptap/pm": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@tiptap/extension-link": "^2.x",
    "@tiptap/extension-image": "^2.x",
    "@tiptap/extension-placeholder": "^2.x",
    "@tiptap/extension-code-block-lowlight": "^2.x",
    "lowlight": "^3.x",
    "use-debounce": "^10.x"
  }
}
```

---

## Testing Checklist

- [ ] Can create new draft post
- [ ] Can publish post
- [ ] Editor formats text correctly
- [ ] Images display in content
- [ ] Blog listing shows published posts only
- [ ] Post page renders content correctly
- [ ] Categories filter works
- [ ] Search finds relevant posts
- [ ] Auto-save works
- [ ] Slug generation works
