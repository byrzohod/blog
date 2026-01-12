# Phase 8: Admin Dashboard Implementation

**Status:** Not Started
**Priority:** Medium
**Dependencies:** Phase 2 (Authentication), Phase 3 (Blog Core)
**Estimated Tasks:** 14

---

## Overview

Build a comprehensive admin dashboard for managing all aspects of the blog including posts, comments, subscribers, and settings.

---

## Goals

1. Create intuitive admin layout and navigation
2. Build dashboard overview with key metrics
3. Implement post management interface
4. Add user and settings management
5. Create activity logging

---

## Tasks

### 8.1 Create Admin Layout

**File:** `src/app/admin/layout.tsx`

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'AUTHOR') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader user={session.user} />
      <div className="flex">
        <AdminSidebar role={session.user.role} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**File:** `src/components/admin/admin-sidebar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  Mail,
  Image,
  Settings,
  Tags,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Posts', href: '/admin/posts', icon: FileText },
  { name: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { name: 'Tags', href: '/admin/tags', icon: Tags },
  { name: 'Media', href: '/admin/media', icon: Image },
  { name: 'Comments', href: '/admin/comments', icon: MessageSquare },
  { name: 'Subscribers', href: '/admin/subscribers', icon: Mail },
  { name: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
  { name: 'Settings', href: '/admin/settings', icon: Settings, adminOnly: true },
];

interface AdminSidebarProps {
  role: string;
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();

  const visibleNav = navigation.filter(
    (item) => !item.adminOnly || role === 'ADMIN'
  );

  return (
    <aside className="w-64 min-h-[calc(100vh-4rem)] border-r border-border bg-background-subtle">
      <nav className="p-4 space-y-1">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-white'
                  : 'text-foreground-muted hover:bg-background-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Acceptance Criteria:**
- [ ] Sidebar navigation works
- [ ] Active state highlighted
- [ ] Role-based menu items
- [ ] Responsive layout

---

### 8.2 Build Dashboard Overview Page

**File:** `src/app/admin/page.tsx`

```typescript
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { StatsCard } from '@/components/admin/stats-card';
import { RecentActivity } from '@/components/admin/recent-activity';
import { QuickActions } from '@/components/admin/quick-actions';
import { DraftPosts } from '@/components/admin/draft-posts';
import { FileText, MessageSquare, Users, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function AdminDashboard() {
  const [
    totalPosts,
    publishedPosts,
    totalComments,
    pendingComments,
    totalSubscribers,
    totalViews,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.subscriber.count({ where: { isVerified: true } }),
    prisma.post.aggregate({ _sum: { views: true } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <QuickActions />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Posts"
          value={totalPosts}
          subtitle={`${publishedPosts} published`}
          icon={FileText}
        />
        <StatsCard
          title="Comments"
          value={totalComments}
          subtitle={pendingComments > 0 ? `${pendingComments} pending` : 'All moderated'}
          icon={MessageSquare}
          alert={pendingComments > 0}
        />
        <StatsCard
          title="Subscribers"
          value={totalSubscribers}
          subtitle="Verified subscribers"
          icon={Users}
        />
        <StatsCard
          title="Total Views"
          value={totalViews._sum.views || 0}
          subtitle="All time"
          icon={Eye}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DraftPosts />
        <RecentActivity />
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows key metrics
- [ ] Quick actions visible
- [ ] Recent activity shown
- [ ] Draft posts listed

---

### 8.3 Add Quick Stats Widgets

**File:** `src/components/admin/stats-card.tsx`

```typescript
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  alert?: boolean;
}

export function StatsCard({ title, value, subtitle, icon: Icon, alert }: StatsCardProps) {
  return (
    <div className={cn(
      'p-6 rounded-lg border',
      alert ? 'border-warning bg-warning/5' : 'border-border bg-background-subtle'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground-muted">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          <p className="text-sm text-foreground-muted mt-1">{subtitle}</p>
        </div>
        <Icon className={cn(
          'h-8 w-8',
          alert ? 'text-warning' : 'text-foreground-muted'
        )} />
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Displays stat value
- [ ] Shows icon
- [ ] Alert styling for pending items

---

### 8.4 Create Recent Activity Feed

**File:** `src/components/admin/recent-activity.tsx`

```typescript
import { prisma } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, FileText, UserPlus } from 'lucide-react';

export async function RecentActivity() {
  const [recentComments, recentPosts, recentSubscribers] = await Promise.all([
    prisma.comment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true } },
        post: { select: { title: true } },
      },
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { title: true, status: true, createdAt: true },
    }),
    prisma.subscriber.findMany({
      take: 5,
      orderBy: { subscribedAt: 'desc' },
      where: { isVerified: true },
      select: { email: true, subscribedAt: true },
    }),
  ]);

  // Combine and sort by date
  const activities = [
    ...recentComments.map(c => ({
      type: 'comment' as const,
      icon: MessageSquare,
      title: `New comment by ${c.author.name}`,
      subtitle: `on "${c.post.title}"`,
      date: c.createdAt,
    })),
    ...recentPosts.map(p => ({
      type: 'post' as const,
      icon: FileText,
      title: `Post ${p.status === 'PUBLISHED' ? 'published' : 'created'}`,
      subtitle: p.title,
      date: p.createdAt,
    })),
    ...recentSubscribers.map(s => ({
      type: 'subscriber' as const,
      icon: UserPlus,
      title: 'New subscriber',
      subtitle: s.email,
      date: s.subscribedAt,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  return (
    <div className="bg-background-subtle rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-background-muted">
              <activity.icon className="h-4 w-4 text-foreground-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="text-sm text-foreground-muted truncate">
                {activity.subtitle}
              </p>
            </div>
            <span className="text-xs text-foreground-muted whitespace-nowrap">
              {formatDistanceToNow(activity.date, { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows recent comments
- [ ] Shows recent posts
- [ ] Shows new subscribers
- [ ] Sorted by date

---

### 8.5 Build Post Management Table

**File:** `src/app/admin/posts/page.tsx`

```typescript
import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { PostsTable } from '@/components/admin/posts-table';
import { Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Posts',
};

interface PostsPageProps {
  searchParams: {
    status?: string;
    search?: string;
    page?: string;
  };
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const status = searchParams.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined;
  const search = searchParams.search;
  const page = Number(searchParams.page) || 1;
  const perPage = 20;

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { content: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.post.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <PostsTable
        posts={posts}
        total={total}
        page={page}
        perPage={perPage}
      />
    </div>
  );
}
```

**File:** `src/components/admin/posts-table.tsx`

Table with columns:
- Title (with link to edit)
- Status (badge)
- Category
- Author
- Comments count
- Date
- Actions (edit, delete, view)

**Acceptance Criteria:**
- [ ] Lists all posts
- [ ] Status filter works
- [ ] Search works
- [ ] Pagination works

---

### 8.6 Add Bulk Actions for Posts

**File:** `src/components/admin/posts-table.tsx` (extend)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash, Archive, Send } from 'lucide-react';

export function PostsTable({ posts, total, page, perPage }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleAll = () => {
    if (selected.length === posts.length) {
      setSelected([]);
    } else {
      setSelected(posts.map(p => p.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  async function bulkAction(action: 'publish' | 'archive' | 'delete') {
    const response = await fetch('/api/admin/posts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected, action }),
    });

    if (response.ok) {
      setSelected([]);
      router.refresh();
    }
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-accent-muted rounded-lg mb-4">
          <span className="text-sm">{selected.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulkAction('publish')}>
            <Send className="mr-2 h-4 w-4" /> Publish
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction('archive')}>
            <Archive className="mr-2 h-4 w-4" /> Archive
          </Button>
          <Button size="sm" variant="destructive" onClick={() => bulkAction('delete')}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      )}

      <table className="w-full">
        <thead>
          <tr>
            <th className="w-8">
              <Checkbox
                checked={selected.length === posts.length}
                onCheckedChange={toggleAll}
              />
            </th>
            <th>Title</th>
            {/* ... other headers */}
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id}>
              <td>
                <Checkbox
                  checked={selected.includes(post.id)}
                  onCheckedChange={() => toggleOne(post.id)}
                />
              </td>
              <td>{post.title}</td>
              {/* ... other cells */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Can select multiple posts
- [ ] Bulk publish works
- [ ] Bulk archive works
- [ ] Bulk delete works

---

### 8.7 Create User Management Page

**File:** `src/app/admin/users/page.tsx`

```typescript
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { UsersTable } from '@/components/admin/users-table';

export const metadata: Metadata = {
  title: 'Users',
};

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { posts: true, comments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>
      <UsersTable users={users} />
    </div>
  );
}
```

Features:
- List all users
- Show role badge
- Post/comment counts
- Change role dropdown
- Ban/suspend option

**Acceptance Criteria:**
- [ ] Lists all users
- [ ] Shows user stats
- [ ] Can change roles
- [ ] Admin-only access

---

### 8.8 Build Settings Page

**File:** `src/app/admin/settings/page.tsx`

```typescript
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from '@/components/admin/settings/general-settings';
import { CommentSettings } from '@/components/admin/settings/comment-settings';
import { EmailSettings } from '@/components/admin/settings/email-settings';
import { MediaSettings } from '@/components/admin/settings/media-settings';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="comments">
          <CommentSettings />
        </TabsContent>

        <TabsContent value="email">
          <EmailSettings />
        </TabsContent>

        <TabsContent value="media">
          <MediaSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Tabbed settings interface
- [ ] General settings work
- [ ] Settings persist

---

### 8.9-8.12 Individual Settings Sections

**General Settings:**
- Site title
- Site description
- Timezone
- Date format

**Comment Settings:**
- Enable/disable comments globally
- Require moderation
- Auto-approve trusted users
- Spam word blocklist

**Email Settings:**
- SMTP configuration
- From address
- Email templates

**Media Settings:**
- Max file size
- Allowed file types
- Image dimensions

**Acceptance Criteria:**
- [ ] All settings editable
- [ ] Validation works
- [ ] Changes saved

---

### 8.13 Build Activity Log

**File:** `prisma/schema.prisma` (add)

```prisma
model ActivityLog {
  id          String   @id @default(cuid())
  action      String
  entityType  String
  entityId    String?
  details     Json?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
  @@map("activity_logs")
}
```

**File:** `src/lib/activity-log.ts`

```typescript
import { prisma } from '@/lib/db';

export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      details: details || undefined,
    },
  });
}
```

Usage:
```typescript
await logActivity(user.id, 'create', 'post', post.id, { title: post.title });
await logActivity(user.id, 'approve', 'comment', commentId);
```

**Acceptance Criteria:**
- [ ] Logs created for key actions
- [ ] Can view activity log
- [ ] Filterable by type

---

### 8.14 Add Admin Notifications

**File:** `src/components/admin/admin-header.tsx`

```typescript
import { Bell } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

async function getNotifications() {
  const pendingComments = await prisma.comment.count({
    where: { status: 'PENDING' },
  });

  const notifications = [];

  if (pendingComments > 0) {
    notifications.push({
      type: 'comments',
      message: `${pendingComments} comments pending moderation`,
      href: '/admin/comments',
    });
  }

  return notifications;
}

export async function AdminHeader({ user }) {
  const notifications = await getNotifications();

  return (
    <header className="h-16 border-b border-border bg-background px-4 flex items-center justify-between">
      <span className="font-semibold">Admin Dashboard</span>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-error text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {notifications.length > 0 ? (
              notifications.map((n, i) => (
                <DropdownMenuItem key={i} asChild>
                  <a href={n.href}>{n.message}</a>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-foreground-muted">
                No new notifications
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
      </div>
    </header>
  );
}
```

**Acceptance Criteria:**
- [ ] Notification bell in header
- [ ] Badge shows count
- [ ] Links to relevant page

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/app/admin/layout.tsx` | Created | Admin layout |
| `src/app/admin/page.tsx` | Created | Dashboard |
| `src/app/admin/posts/page.tsx` | Created | Post management |
| `src/app/admin/users/page.tsx` | Created | User management |
| `src/app/admin/settings/page.tsx` | Created | Settings |
| `src/components/admin/*.tsx` | Created | Admin components |
| `src/lib/activity-log.ts` | Created | Activity logging |
| `prisma/schema.prisma` | Modified | ActivityLog model |

---

## Testing Checklist

- [ ] Admin layout renders
- [ ] Sidebar navigation works
- [ ] Dashboard shows stats
- [ ] Recent activity displays
- [ ] Post list with filters
- [ ] Bulk actions work
- [ ] User management (admin only)
- [ ] Settings save correctly
- [ ] Activity log records
- [ ] Notifications appear
