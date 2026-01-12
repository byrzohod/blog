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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

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

    // Check if tag exists
    const existing = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check if slug is taken by another tag
    const slugTaken = await prisma.tag.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (slugTaken) {
      return NextResponse.json(
        { error: 'A tag with this slug already exists' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: { name, slug },
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'update',
      entityType: 'tag',
      entityId: tag.id,
      details: { name: tag.name, slug: tag.slug },
    });

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Update tag error:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Delete tag (Prisma will handle removing the tag from posts due to relation)
    await prisma.tag.delete({
      where: { id },
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'delete',
      entityType: 'tag',
      entityId: id,
      details: { name: tag.name, slug: tag.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
