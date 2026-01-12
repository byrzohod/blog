# Phase 6: Comments System Implementation

**Status:** Not Started
**Priority:** Medium
**Dependencies:** Phase 2 (Authentication), Phase 3 (Blog Core)
**Estimated Tasks:** 16

---

## Overview

Implement a full commenting system with threaded replies, moderation, and notifications. Comments allow readers to engage with content and build community.

---

## Goals

1. Create Comment model with threaded replies
2. Build comment display and submission UI
3. Implement moderation workflow
4. Add email notifications for comments
5. Prevent spam with basic filtering

---

## Tasks

### 6.1 Create Comment Model

**File:** `prisma/schema.prisma` (update)

```prisma
model Comment {
  id        String        @id @default(cuid())
  content   String        @db.Text
  status    CommentStatus @default(PENDING)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  post     Post    @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId   String
  author   User    @relation(fields: [authorId], references: [id])
  authorId String

  // Threading
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  parentId String?
  replies  Comment[] @relation("CommentReplies")

  @@index([postId, status])
  @@index([authorId])
  @@index([parentId])
  @@map("comments")
}

enum CommentStatus {
  PENDING
  APPROVED
  SPAM
  TRASH
}
```

Run migration:
```bash
npx prisma migrate dev --name add_comments
```

**Acceptance Criteria:**
- [ ] Comment model created
- [ ] Self-referential relation for replies
- [ ] Cascade delete when post deleted

---

### 6.2 Add Parent/Reply Relationship

Already defined in 6.1 with `parent` and `replies` relations.

**Query example:**
```typescript
// Get comments with replies
const comments = await prisma.comment.findMany({
  where: {
    postId,
    parentId: null, // Top-level only
    status: 'APPROVED',
  },
  include: {
    author: { select: { id: true, name: true, image: true } },
    replies: {
      where: { status: 'APPROVED' },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

**Acceptance Criteria:**
- [ ] Can fetch top-level comments
- [ ] Replies nested under parents
- [ ] Depth limit enforced (e.g., 2 levels)

---

### 6.3 Run Database Migration

```bash
npx prisma migrate dev --name add_comments
npx prisma generate
```

**Acceptance Criteria:**
- [ ] Migration successful
- [ ] Comments table created
- [ ] Indexes created

---

### 6.4 Build Comment Display Component

**File:** `src/components/blog/comments.tsx`

```typescript
import { prisma } from '@/lib/db';
import { CommentItem } from './comment-item';
import { CommentForm } from './comment-form';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface CommentsProps {
  postId: string;
}

export async function Comments({ postId }: CommentsProps) {
  const session = await getServerSession(authOptions);

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentId: null,
      status: 'APPROVED',
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      replies: {
        where: { status: 'APPROVED' },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const commentCount = await prisma.comment.count({
    where: { postId, status: 'APPROVED' },
  });

  return (
    <div className="space-y-8">
      <p className="text-foreground-muted">
        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
      </p>

      {session ? (
        <CommentForm postId={postId} />
      ) : (
        <p className="text-foreground-muted">
          <a href="/login" className="text-accent hover:underline">
            Sign in
          </a>{' '}
          to leave a comment.
        </p>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            currentUserId={session?.user?.id}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <p className="text-foreground-muted text-center py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows all approved comments
- [ ] Shows comment count
- [ ] Prompts login if not signed in

---

### 6.5 Create Threaded Reply Display

**File:** `src/components/blog/comment-item.tsx`

```typescript
'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentForm } from './comment-form';
import { MessageSquare, MoreHorizontal, Trash, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    author: { id: string; name: string | null; image: string | null };
    replies?: CommentItemProps['comment'][];
  };
  postId: string;
  currentUserId?: string;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  postId,
  currentUserId,
  isReply = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const isAuthor = currentUserId === comment.author.id;

  const initials = comment.author.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className={`${isReply ? 'ml-8 mt-4' : ''}`}>
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.author.image || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{comment.author.name}</span>
              <span className="text-sm text-foreground-muted">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && (
                  <DropdownMenuItem className="text-error">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-2 prose prose-sm max-w-none">
            <p>{comment.content}</p>
          </div>

          {!isReply && currentUserId && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Reply
              </Button>
            </div>
          )}

          {showReplyForm && (
            <div className="mt-4">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onSuccess={() => setShowReplyForm(false)}
                placeholder="Write a reply..."
              />
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows author avatar and name
- [ ] Shows relative time
- [ ] Reply button for logged-in users
- [ ] Nested replies displayed

---

### 6.6 Build Comment Submission Form

**File:** `src/components/blog/comment-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  placeholder?: string;
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  placeholder = 'Share your thoughts...',
}: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, parentId, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      setContent('');
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={4}
        disabled={isSubmitting}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Post Comment'
          )}
        </Button>
      </div>
    </form>
  );
}
```

**Acceptance Criteria:**
- [ ] Textarea for comment content
- [ ] Submits to API
- [ ] Shows loading state
- [ ] Refreshes page on success

---

### 6.7 Add Reply Functionality

Already implemented in 6.5 and 6.6 with `parentId` support.

**Acceptance Criteria:**
- [ ] Reply form appears inline
- [ ] Reply linked to parent
- [ ] Closes form on success

---

### 6.8 Implement Comment Submission API

**File:** `src/app/api/comments/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { checkSpam } from '@/lib/spam-filter';

const commentSchema = z.object({
  postId: z.string(),
  parentId: z.string().optional(),
  content: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { postId, parentId, content } = commentSchema.parse(body);

    // Verify post exists and allows comments
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, allowComments: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (!post.allowComments) {
      return NextResponse.json(
        { error: 'Comments are disabled for this post' },
        { status: 403 }
      );
    }

    // Check for spam
    const isSpam = await checkSpam(content, user.email);
    const status = isSpam ? 'SPAM' : 'PENDING';

    // Auto-approve for post author
    const autoApprove = post.authorId === user.id;

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        parentId,
        authorId: user.id,
        status: autoApprove ? 'APPROVED' : status,
      },
    });

    // TODO: Send notification to post author if not auto-approved

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed' },
        { status: 400 }
      );
    }

    console.error('Comment error:', error);
    return NextResponse.json(
      { error: 'Failed to submit comment' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Validates input
- [ ] Checks post allows comments
- [ ] Creates pending comment
- [ ] Auto-approves author's comments

---

### 6.9 Add Comment Count to Posts

Already implemented in blog listing and post page queries.

```typescript
// In post card or listing
const _count = {
  comments: true,
};

// Display
<span>{post._count.comments} comments</span>
```

**Acceptance Criteria:**
- [ ] Count shows on post cards
- [ ] Only counts approved comments

---

### 6.10 Build Comment Moderation Queue

**File:** `src/app/admin/comments/page.tsx`

```typescript
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { CommentModerationTable } from '@/components/admin/comment-moderation-table';

export const metadata: Metadata = {
  title: 'Comment Moderation',
};

export default async function CommentModerationPage() {
  const [pending, approved, spam] = await Promise.all([
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.comment.count({ where: { status: 'APPROVED' } }),
    prisma.comment.count({ where: { status: 'SPAM' } }),
  ]);

  const comments = await prisma.comment.findMany({
    where: { status: 'PENDING' },
    include: {
      author: { select: { name: true, email: true, image: true } },
      post: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="container-wide py-8">
      <h1 className="text-3xl font-bold mb-8">Comment Moderation</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-warning/10 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold">{pending}</p>
          <p className="text-sm text-foreground-muted">Pending</p>
        </div>
        <div className="bg-success/10 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold">{approved}</p>
          <p className="text-sm text-foreground-muted">Approved</p>
        </div>
        <div className="bg-error/10 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold">{spam}</p>
          <p className="text-sm text-foreground-muted">Spam</p>
        </div>
      </div>

      <CommentModerationTable comments={comments} />
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows pending comments
- [ ] Displays comment stats
- [ ] Quick access to approve/reject

---

### 6.11 Implement Approve/Reject Actions

**File:** `src/app/actions/comments.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-utils';

export async function approveComment(commentId: string) {
  await requireRole(['ADMIN', 'AUTHOR']);

  await prisma.comment.update({
    where: { id: commentId },
    data: { status: 'APPROVED' },
  });

  revalidatePath('/admin/comments');
}

export async function rejectComment(commentId: string) {
  await requireRole(['ADMIN', 'AUTHOR']);

  await prisma.comment.update({
    where: { id: commentId },
    data: { status: 'TRASH' },
  });

  revalidatePath('/admin/comments');
}

export async function markAsSpam(commentId: string) {
  await requireRole(['ADMIN', 'AUTHOR']);

  await prisma.comment.update({
    where: { id: commentId },
    data: { status: 'SPAM' },
  });

  revalidatePath('/admin/comments');
}

export async function deleteComment(commentId: string) {
  await requireRole(['ADMIN', 'AUTHOR']);

  await prisma.comment.delete({
    where: { id: commentId },
  });

  revalidatePath('/admin/comments');
}
```

**Acceptance Criteria:**
- [ ] Approve changes status
- [ ] Reject moves to trash
- [ ] Spam marks as spam
- [ ] Delete removes permanently

---

### 6.12 Add Spam Filtering

**File:** `src/lib/spam-filter.ts`

```typescript
const SPAM_WORDS = [
  'viagra',
  'casino',
  'lottery',
  'winner',
  'click here',
  'free money',
  // Add more as needed
];

const SPAM_PATTERNS = [
  /\b(https?:\/\/){3,}/i, // Multiple URLs
  /(.)\1{10,}/, // Repeated characters
  /[A-Z]{20,}/, // All caps blocks
];

export async function checkSpam(content: string, email: string): Promise<boolean> {
  const lowerContent = content.toLowerCase();

  // Check for spam words
  for (const word of SPAM_WORDS) {
    if (lowerContent.includes(word)) {
      return true;
    }
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }

  // Check if email is in blocklist
  // Could be extended to check external blocklist

  return false;
}
```

**Acceptance Criteria:**
- [ ] Detects common spam words
- [ ] Detects spam patterns
- [ ] Extensible for more rules

---

### 6.13 Create Comment Notifications

**File:** `src/lib/notifications.ts`

```typescript
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/db';

export async function notifyNewComment(comment: {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  parentId?: string;
}) {
  const post = await prisma.post.findUnique({
    where: { id: comment.postId },
    include: { author: true },
  });

  if (!post) return;

  // Notify post author
  if (post.authorId !== comment.authorId) {
    await sendEmail({
      to: post.author.email,
      subject: `New comment on "${post.title}"`,
      html: `
        <p>Someone commented on your post "${post.title}":</p>
        <blockquote>${comment.content}</blockquote>
        <p><a href="${process.env.NEXTAUTH_URL}/admin/comments">Moderate comments</a></p>
      `,
    });
  }

  // Notify parent comment author (for replies)
  if (comment.parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: comment.parentId },
      include: { author: true },
    });

    if (parentComment && parentComment.authorId !== comment.authorId) {
      await sendEmail({
        to: parentComment.author.email,
        subject: `Reply to your comment`,
        html: `
          <p>Someone replied to your comment:</p>
          <blockquote>${comment.content}</blockquote>
          <p><a href="${process.env.NEXTAUTH_URL}/blog/${post.slug}">View comment</a></p>
        `,
      });
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Post author notified of comments
- [ ] Reply author notified of replies
- [ ] Links to moderation/post

---

### 6.14 Add Gravatar Support

**File:** `src/lib/gravatar.ts`

```typescript
import crypto from 'crypto';

export function getGravatarUrl(email: string, size: number = 80): string {
  const hash = crypto
    .createHash('md5')
    .update(email.toLowerCase().trim())
    .digest('hex');

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
```

Use in Avatar component:
```tsx
const avatarUrl = user.image || getGravatarUrl(user.email);
```

**Acceptance Criteria:**
- [ ] Shows Gravatar if no custom image
- [ ] Falls back to identicon

---

### 6.15-6.16 Edit/Delete Own Comments

Add client-side actions for users to manage their own comments.

**File:** `src/app/api/comments/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth();

  const comment = await prisma.comment.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  });

  if (!comment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Only author can delete (or admin)
  if (comment.authorId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth();
  const { content } = await request.json();

  const comment = await prisma.comment.findUnique({
    where: { id: params.id },
    select: { authorId: true, createdAt: true },
  });

  if (!comment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Only author can edit
  if (comment.authorId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Time limit for editing (e.g., 15 minutes)
  const editWindow = 15 * 60 * 1000;
  if (Date.now() - comment.createdAt.getTime() > editWindow) {
    return NextResponse.json(
      { error: 'Edit window expired' },
      { status: 403 }
    );
  }

  await prisma.comment.update({
    where: { id: params.id },
    data: { content },
  });

  return NextResponse.json({ success: true });
}
```

**Acceptance Criteria:**
- [ ] Users can delete own comments
- [ ] Users can edit within time window
- [ ] Proper authorization checks

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Add Comment model |
| `src/components/blog/comments.tsx` | Created | Comment display |
| `src/components/blog/comment-item.tsx` | Created | Single comment |
| `src/components/blog/comment-form.tsx` | Created | Comment submission |
| `src/app/api/comments/route.ts` | Created | Comment API |
| `src/app/api/comments/[id]/route.ts` | Created | Edit/delete API |
| `src/app/admin/comments/page.tsx` | Created | Moderation page |
| `src/app/actions/comments.ts` | Created | Server actions |
| `src/lib/spam-filter.ts` | Created | Spam detection |
| `src/lib/notifications.ts` | Created | Email notifications |
| `src/lib/gravatar.ts` | Created | Gravatar URLs |

---

## Testing Checklist

- [ ] Can submit comment when logged in
- [ ] Cannot comment when logged out
- [ ] Replies nest under parent
- [ ] Pending comments not shown publicly
- [ ] Moderation approve works
- [ ] Moderation reject works
- [ ] Spam detection catches spam
- [ ] Notifications sent
- [ ] Can delete own comment
- [ ] Can edit within time window
- [ ] Gravatar shows correctly
