import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
});

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json(
      { error: 'Failed to get tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = tagSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, slug } = result.data;

    // Check if slug exists
    const existing = await prisma.tag.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A tag with this slug already exists' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: { name, slug },
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'create',
      entityType: 'tag',
      entityId: tag.id,
      details: { name: tag.name, slug: tag.slug },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
