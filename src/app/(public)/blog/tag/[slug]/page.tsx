import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Tag } from 'lucide-react';
import { prisma } from '@/lib/db';
import { PostCard } from '@/components/blog/post-card';
import { Button } from '@/components/ui/button';

// Force dynamic generation to avoid build-time database access
export const dynamic = 'force-dynamic';

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

async function getTag(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
  });
}

async function getPostsByTag(tagId: string) {
  return prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date(),
      },
      tags: {
        some: {
          id: tagId,
        },
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
  });
}

async function getPopularTags() {
  return prisma.tag.findMany({
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
      posts: {
        _count: 'desc',
      },
    },
    take: 20,
  });
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    return {
      title: 'Tag Not Found',
    };
  }

  return {
    title: `#${tag.name} - Blog`,
    description: `Posts tagged with ${tag.name}`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    notFound();
  }

  const [posts, popularTags] = await Promise.all([
    getPostsByTag(tag.id),
    getPopularTags(),
  ]);

  return (
    <div className="container-wide py-12">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Posts
          </Link>
        </Button>
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-8 w-8 text-accent" />
          <h1 className="text-4xl font-bold">{tag.name}</h1>
        </div>
        <p className="text-foreground-muted">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'} with this tag
        </p>
      </div>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {popularTags.map((t) => (
            <Link
              key={t.id}
              href={`/blog/tag/${t.slug}`}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                t.slug === slug
                  ? 'bg-accent text-white'
                  : 'bg-background-subtle hover:bg-background-muted'
              }`}
            >
              #{t.name}
              <span className={`ml-1 ${t.slug === slug ? 'text-white/70' : 'text-foreground-muted'}`}>
                ({t._count.posts})
              </span>
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-foreground-muted text-lg">
            No posts with this tag yet.
          </p>
          <Button asChild className="mt-4">
            <Link href="/blog">View All Posts</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
