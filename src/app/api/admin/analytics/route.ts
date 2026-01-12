import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getAnalyticsSummary,
  getTopPosts,
  getDailyViews,
  getTopReferrers,
} from '@/lib/analytics';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const [summary, topPosts, dailyViews, topReferrers] = await Promise.all([
      getAnalyticsSummary(),
      getTopPosts(10, days),
      getDailyViews(days),
      getTopReferrers(10, days),
    ]);

    return NextResponse.json({
      summary,
      topPosts,
      dailyViews,
      topReferrers,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
