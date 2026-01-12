import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

const UPLOAD_DIR = path.join(process.cwd(), 'public');

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can delete media' },
        { status: 403 }
      );
    }

    // Find the media record
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Delete all file variants
    const urlsToDelete = [
      media.url,
      media.thumbnailUrl,
      media.mediumUrl,
      media.largeUrl,
    ].filter(Boolean) as string[];

    for (const url of urlsToDelete) {
      const filePath = path.join(UPLOAD_DIR, url);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
        } catch (err) {
          console.error(`Failed to delete file: ${filePath}`, err);
        }
      }
    }

    // Delete the database record
    await prisma.media.delete({
      where: { id },
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'delete',
      entityType: 'media',
      entityId: id,
      details: { name: media.originalName, url: media.url },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
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
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'AUTHOR') {
      return NextResponse.json(
        { error: 'You do not have permission' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { alt } = body;

    // Find the media record
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Update the media record
    const updatedMedia = await prisma.media.update({
      where: { id },
      data: { alt: alt || null },
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'update',
      entityType: 'media',
      entityId: id,
      details: { name: media.originalName, alt },
    });

    return NextResponse.json({ media: updatedMedia });
  } catch (error) {
    console.error('Update media error:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}
