import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { PostCard } from '@/components/blog/post-card';
import { Button } from '@/components/ui/button';

// Force dynamic generation to avoid build-time database access
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest posts from Book of Life.',
};

const POSTS_PER_PAGE = 9;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

async function getPosts(page: number) {
  const skip = (page - 1) * POSTS_PER_PAGE;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      skip,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
      },
    }),
  ]);

  return { posts, total, totalPages: Math.ceil(total / POSTS_PER_PAGE) };
}

async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: {
        select: {
          posts: {
            where: {
              status: 'PUBLISHED',
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10));

  const [{ posts, totalPages }, categories] = await Promise.all([
    getPosts(currentPage),
    getCategories(),
  ]);

  const featuredPost = currentPage === 1 ? posts[0] : null;
  const otherPosts = currentPage === 1 ? posts.slice(1) : posts;

  return (
    <div className="container-wide py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-foreground-muted text-lg">
          Thoughts, stories, and ideas from my journey.
        </p>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className="px-3 py-1 text-sm rounded-full bg-background-subtle hover:bg-background-muted transition-colors"
            >
              {category.name}
              <span className="ml-1 text-foreground-muted">({category._count.posts})</span>
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-foreground-muted text-lg">No posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-12">
              <PostCard post={featuredPost} featured />
            </div>
          )}

          {/* Other Posts */}
          {otherPosts.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otherPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <Button
                asChild={currentPage > 1}
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
              >
                {currentPage > 1 ? (
                  <Link href={`/blog?page=${currentPage - 1}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Link>
                ) : (
                  <span>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </span>
                )}
              </Button>

              <span className="px-4 text-sm text-foreground-muted">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                asChild={currentPage < totalPages}
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
              >
                {currentPage < totalPages ? (
                  <Link href={`/blog?page=${currentPage + 1}`}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <span>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
