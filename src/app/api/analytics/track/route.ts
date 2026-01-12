import { NextResponse } from 'next/server';
import { z } from 'zod';
import { trackPageView } from '@/lib/analytics';

const trackSchema = z.object({
  postId: z.string().optional(),
  path: z.string().min(1),
  referrer: z.string().optional(),
  sessionId: z.string().min(1),
});

// Rate limiting map (in-memory, resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // Max requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0] || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = trackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || undefined;

    await trackPageView({
      postId: result.data.postId,
      path: result.data.path,
      referrer: result.data.referrer,
      userAgent,
      sessionId: result.data.sessionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track page view error:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
