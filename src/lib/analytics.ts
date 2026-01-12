import { prisma } from '@/lib/db';

export interface PageViewInput {
  postId?: string | null;
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
  sessionId: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
}

export interface TopPost {
  id: string;
  title: string;
  slug: string;
  views: number;
}

export interface DailyViews {
  date: string;
  views: number;
}

export interface TopReferrer {
  referrer: string;
  count: number;
}

/**
 * Track a page view
 */
export async function trackPageView(input: PageViewInput): Promise<void> {
  try {
    // Check for duplicate views in the last 30 minutes from same session
    const recentView = await prisma.pageView.findFirst({
      where: {
        sessionId: input.sessionId,
        path: input.path,
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes
        },
      },
    });

    if (recentView) {
      // Don't track duplicate view
      return;
    }

    await prisma.pageView.create({
      data: {
        postId: input.postId || null,
        path: input.path,
        referrer: input.referrer || null,
        userAgent: input.userAgent || null,
        sessionId: input.sessionId,
      },
    });
  } catch (error) {
    // Don't throw - analytics should not break main functionality
    console.error('Failed to track page view:', error);
  }
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(startOfToday);
  startOfMonth.setDate(startOfMonth.getDate() - 30);

  const [totalViews, todayViews, weekViews, monthViews] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({
      where: {
        createdAt: { gte: startOfToday },
      },
    }),
    prisma.pageView.count({
      where: {
        createdAt: { gte: startOfWeek },
      },
    }),
    prisma.pageView.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  return {
    totalViews,
    todayViews,
    weekViews,
    monthViews,
  };
}

/**
 * Get top posts by views
 */
export async function getTopPosts(limit = 10, days = 30): Promise<TopPost[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await prisma.pageView.groupBy({
    by: ['postId'],
    where: {
      postId: { not: null },
      createdAt: { gte: startDate },
    },
    _count: {
      postId: true,
    },
    orderBy: {
      _count: {
        postId: 'desc',
      },
    },
    take: limit,
  });

  // Get post details
  const postIds = results.map((r) => r.postId).filter(Boolean) as string[];
  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    select: { id: true, title: true, slug: true },
  });

  const postMap = new Map(posts.map((p) => [p.id, p]));

  return results
    .map((r) => {
      const post = postMap.get(r.postId!);
      if (!post) return null;
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        views: r._count.postId,
      };
    })
    .filter(Boolean) as TopPost[];
}

/**
 * Get daily views for chart
 */
export async function getDailyViews(days = 30): Promise<DailyViews[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const views = await prisma.pageView.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group by date
  const viewsByDate: Record<string, number> = {};

  // Initialize all dates with 0
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    viewsByDate[dateStr] = 0;
  }

  // Count views
  for (const view of views) {
    const dateStr = view.createdAt.toISOString().split('T')[0];
    viewsByDate[dateStr] = (viewsByDate[dateStr] || 0) + 1;
  }

  return Object.entries(viewsByDate).map(([date, viewCount]) => ({
    date,
    views: viewCount,
  }));
}

/**
 * Get top referrers
 */
export async function getTopReferrers(limit = 10, days = 30): Promise<TopReferrer[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await prisma.pageView.groupBy({
    by: ['referrer'],
    where: {
      referrer: { not: null },
      createdAt: { gte: startDate },
    },
    _count: {
      referrer: true,
    },
    orderBy: {
      _count: {
        referrer: 'desc',
      },
    },
    take: limit,
  });

  return results.map((r) => ({
    referrer: r.referrer || 'Direct',
    count: r._count.referrer,
  }));
}

/**
 * Get views for a specific post
 */
export async function getPostViews(postId: string, days = 30): Promise<number> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return prisma.pageView.count({
    where: {
      postId,
      createdAt: { gte: startDate },
    },
  });
}

/**
 * Generate a session ID for anonymous tracking
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
