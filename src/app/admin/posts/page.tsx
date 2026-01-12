import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Force dynamic generation to avoid build-time database access
export const dynamic = 'force-dynamic';

async function getPosts() {
  return prisma.post.findMany({
    include: {
      author: {
        select: {
          name: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-foreground-muted">Manage your blog posts</p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground-muted mb-4">No posts yet.</p>
              <Button asChild>
                <Link href="/admin/posts/new">Create your first post</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Author</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Comments</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-border last:border-0">
                      <td className="py-4">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="font-medium hover:text-accent transition-colors"
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className="py-4 text-foreground-muted">
                        {post.author.name}
                      </td>
                      <td className="py-4">
                        {post.category ? (
                          <Badge variant="secondary">{post.category.name}</Badge>
                        ) : (
                          <span className="text-foreground-muted">-</span>
                        )}
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={
                            post.status === 'PUBLISHED'
                              ? 'default'
                              : post.status === 'DRAFT'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {post.status.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="py-4 text-foreground-muted">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="py-4 text-foreground-muted">
                        {post._count.comments}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === 'PUBLISHED' && (
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/blog/${post.slug}`} target="_blank">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/admin/posts/${post.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-error hover:text-error">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
