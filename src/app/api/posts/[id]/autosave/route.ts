import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

const autosaveSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if post exists and user can edit it
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, updatedAt: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check authorization (admin can edit any, author can edit own)
    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'ADMIN' && post.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = autosaveSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      );
    }

    // Only update non-empty fields
    const updateData: Record<string, unknown> = {};
    const data = result.data;

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'Nothing to update' }, { status: 200 });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
      select: { id: true, updatedAt: true },
    });

    return NextResponse.json({
      success: true,
      lastSavedAt: updatedPost.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Autosave error:', error);
    return NextResponse.json(
      { error: 'Failed to autosave' },
      { status: 500 }
    );
  }
}
