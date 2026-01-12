import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, FileText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';

// Force dynamic generation to avoid build-time database access
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Archive',
  description: 'Browse all posts by date',
};

interface PostsByYear {
  [year: string]: {
    [month: string]: {
      id: string;
      title: string;
      slug: string;
      publishedAt: Date;
    }[];
  };
}

async function getPostsGroupedByDate() {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date(),
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
  });

  // Group posts by year and month
  const grouped: PostsByYear = {};

  posts.forEach((post) => {
    if (!post.publishedAt) return;

    const year = post.publishedAt.getFullYear().toString();
    const month = post.publishedAt.toLocaleString('default', { month: 'long' });

    if (!grouped[year]) {
      grouped[year] = {};
    }

    if (!grouped[year][month]) {
      grouped[year][month] = [];
    }

    grouped[year][month].push({
      id: post.id,
      title: post.title,
      slug: post.slug,
      publishedAt: post.publishedAt,
    });
  });

  return grouped;
}

async function getStats() {
  const [totalPosts, categories, tags] = await Promise.all([
    prisma.post.count({
      where: { status: 'PUBLISHED' },
    }),
    prisma.category.count(),
    prisma.tag.count(),
  ]);

  return { totalPosts, categories, tags };
}

export default async function ArchivePage() {
  const [postsByDate, stats] = await Promise.all([
    getPostsGroupedByDate(),
    getStats(),
  ]);

  const years = Object.keys(postsByDate).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className="container-prose py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Archive</h1>
        <p className="text-foreground-muted text-lg">
          Browse all posts organized by date
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3 mb-12">
        <div className="p-4 rounded-lg bg-background-subtle text-center">
          <div className="text-3xl font-bold text-accent">{stats.totalPosts}</div>
          <div className="text-sm text-foreground-muted">Posts</div>
        </div>
        <div className="p-4 rounded-lg bg-background-subtle text-center">
          <div className="text-3xl font-bold text-accent">{stats.categories}</div>
          <div className="text-sm text-foreground-muted">Categories</div>
        </div>
        <div className="p-4 rounded-lg bg-background-subtle text-center">
          <div className="text-3xl font-bold text-accent">{stats.tags}</div>
          <div className="text-sm text-foreground-muted">Tags</div>
        </div>
      </div>

      {years.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
          <p className="text-foreground-muted text-lg">No posts yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {years.map((year) => (
            <div key={year}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-accent" />
                {year}
              </h2>

              <div className="space-y-8">
                {Object.entries(postsByDate[year])
                  .sort((a, b) => {
                    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
                    return months.indexOf(b[0]) - months.indexOf(a[0]);
                  })
                  .map(([month, monthPosts]) => (
                    <div key={month} className="pl-4 border-l-2 border-border">
                      <h3 className="text-lg font-semibold text-foreground-muted mb-4">
                        {month}
                      </h3>
                      <ul className="space-y-3">
                        {monthPosts.map((post) => (
                          <li key={post.id} className="flex items-start gap-3">
                            <span className="text-sm text-foreground-subtle whitespace-nowrap pt-0.5">
                              {formatDate(post.publishedAt)}
                            </span>
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-foreground hover:text-accent transition-colors"
                            >
                              {post.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
