import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { FileText, Eye, MessageSquare, Users, PlusCircle } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Force dynamic generation to avoid build-time database access
export const dynamic = 'force-dynamic';

async function getStats() {
  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    totalComments,
    pendingComments,
    totalSubscribers,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'DRAFT' } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.subscriber.count({ where: { isVerified: true } }),
  ]);

  return {
    totalPosts,
    publishedPosts,
    draftPosts,
    totalComments,
    pendingComments,
    totalSubscribers,
  };
}

async function getRecentPosts() {
  return prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const [stats, recentPosts] = await Promise.all([getStats(), getRecentPosts()]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-foreground-muted">Welcome back, {session?.user?.name}</p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-foreground-muted">
              {stats.publishedPosts} published, {stats.draftPosts} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-foreground-muted">
              {stats.pendingComments} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
            <p className="text-xs text-foreground-muted">Verified subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Eye className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/" target="_blank">
                View Site
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-foreground-muted text-sm">No posts yet.</p>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="font-medium hover:text-accent transition-colors"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-foreground-muted">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      post.status === 'PUBLISHED'
                        ? 'bg-success/10 text-success'
                        : post.status === 'DRAFT'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-background-muted text-foreground-muted'
                    )}
                  >
                    {post.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
