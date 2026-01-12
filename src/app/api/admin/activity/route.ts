import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActivityLogs, EntityType, ActivityAction } from '@/lib/activity-log';

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const userId = searchParams.get('userId') || undefined;
    const entityType = searchParams.get('entityType') as EntityType | undefined;
    const action = searchParams.get('action') as ActivityAction | undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const result = await getActivityLogs({
      page,
      limit: Math.min(limit, 100), // Cap at 100
      userId,
      entityType,
      action,
      startDate,
      endDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}
