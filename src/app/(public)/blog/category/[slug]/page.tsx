import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Rss } from 'lucide-react';
import { prisma } from '@/lib/db';
import { PostCard } from '@/components/blog/post-card';
import { Button } from '@/components/ui/button';

// Force dynamic generation to avoid build-time database access
export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

async function getCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
  });
}

async function getPostsByCategory(categoryId: string) {
  return prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      categoryId,
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
  });
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

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} - Blog`,
    description: category.description || `Posts in ${category.name} category`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const [posts, categories] = await Promise.all([
    getPostsByCategory(category.id),
    getCategories(),
  ]);

  return (
    <div className="container-wide py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Posts
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/feed/category/${slug}`} target="_blank">
              <Rss className="h-4 w-4 mr-2" />
              RSS Feed
            </Link>
          </Button>
        </div>
        <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-foreground-muted text-lg">{category.description}</p>
        )}
        <p className="text-foreground-muted mt-2">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </p>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/blog"
            className="px-3 py-1 text-sm rounded-full bg-background-subtle hover:bg-background-muted transition-colors"
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog/category/${cat.slug}`}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                cat.slug === slug
                  ? 'bg-accent text-white'
                  : 'bg-background-subtle hover:bg-background-muted'
              }`}
            >
              {cat.name}
              <span className={`ml-1 ${cat.slug === slug ? 'text-white/70' : 'text-foreground-muted'}`}>
                ({cat._count.posts})
              </span>
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-foreground-muted text-lg">
            No posts in this category yet.
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
