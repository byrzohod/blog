import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Cpu, Hash } from "lucide-react";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/blog/post-card";
import { Button } from "@/components/ui/button";

// Force dynamic generation to avoid build-time database access
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Read the latest posts from Book of Life.",
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
        status: "PUBLISHED",
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
        publishedAt: "desc",
      },
      skip,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({
      where: {
        status: "PUBLISHED",
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
              status: "PUBLISHED",
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(
    1,
    parseInt(resolvedSearchParams.page || "1", 10),
  );

  const [{ posts, totalPages }, categories] = await Promise.all([
    getPosts(currentPage),
    getCategories(),
  ]);

  const featuredPost = currentPage === 1 ? posts[0] : null;
  const otherPosts = currentPage === 1 ? posts.slice(1) : posts;

  return (
    <div className="relative">
      <div className="absolute inset-0 matrix-grid opacity-30" />
      <div className="absolute inset-0 matrix-rain opacity-30" />
      <div className="absolute inset-0 matrix-scanlines pointer-events-none" />

      <div className="container-wide relative z-10 py-12">
        <div className="mb-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-foreground-subtle">
              Logs Directory
            </p>
            <h1 className="mt-4 text-4xl font-semibold">/blog</h1>
            <p className="mt-4 text-foreground-muted text-lg max-w-2xl">
              Shipping notes, system insights, and the thinking behind the
              craft.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-6 matrix-border">
            <div className="flex items-center gap-3 text-sm text-foreground-muted">
              <Cpu className="h-4 w-4 text-accent" />
              Status Feed
            </div>
            <div className="mt-4 space-y-3 text-sm text-foreground-muted">
              <p>Signal: curated posts only</p>
              <p>Scope: engineering, systems, and creative execution</p>
              <p>Refresh: weekly drops</p>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog/category/${category.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-xs text-foreground-muted transition-colors hover:text-foreground hover:border-accent/40"
              >
                <Hash className="h-3 w-3 text-accent" />
                {category.name}
                <span className="text-foreground-subtle">
                  {category._count.posts}
                </span>
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-background/70 p-10 text-center text-foreground-muted matrix-border">
            <p>No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-10">
            {featuredPost && (
              <div>
                <PostCard post={featuredPost} featured />
              </div>
            )}

            {otherPosts.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {otherPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

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
    </div>
  );
}
