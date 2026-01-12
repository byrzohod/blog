import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a comment' },
        { status: 401 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check permission: Admin can delete any, users can only delete their own
    if (session.user.role !== 'ADMIN' && comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete replies first (if any)
    await prisma.comment.deleteMany({
      where: { parentId: id },
    });

    // Delete the comment
    await prisma.comment.delete({
      where: { id },
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'delete',
      entityType: 'comment',
      entityId: id,
      details: { content: comment.content.substring(0, 100) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to edit a comment' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check permission: Admin can edit any, users can only edit their own
    if (session.user.role !== 'ADMIN' && comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content: content.trim() },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'update',
      entityType: 'comment',
      entityId: updatedComment.id,
      details: { content: content.trim().substring(0, 100) },
    });

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}
