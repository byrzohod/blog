import { Metadata } from 'next';
import { Search } from 'lucide-react';
import { prisma } from '@/lib/db';
import { PostCard } from '@/components/blog/post-card';
import { SearchForm } from './search-form';

// Force dynamic generation to avoid build-time database access
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search blog posts',
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

async function searchPosts(query: string) {
  if (!query || query.length < 2) {
    return [];
  }

  return prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date(),
      },
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
      ],
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
    take: 20,
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query } = await searchParams;
  const posts = query ? await searchPosts(query) : [];

  return (
    <div className="container-wide py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Search</h1>
        <p className="text-foreground-muted text-lg">
          Find posts by title, content, or excerpt
        </p>
      </div>

      <SearchForm initialQuery={query || ''} />

      {query && (
        <div className="mt-8">
          <p className="text-foreground-muted mb-6">
            {posts.length === 0 ? (
              <>No results found for &quot;{query}&quot;</>
            ) : (
              <>
                Found {posts.length} {posts.length === 1 ? 'result' : 'results'} for &quot;{query}&quot;
              </>
            )}
          </p>

          {posts.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <p className="text-foreground-muted">
                Try different keywords or check the spelling
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
          <p className="text-foreground-muted">
            Enter a search term to find posts
          </p>
        </div>
      )}
    </div>
  );
}
