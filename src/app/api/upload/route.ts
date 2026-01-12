import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ImageSize {
  name: string;
  width: number;
  height: number;
}

const IMAGE_SIZES: ImageSize[] = [
  { name: 'thumbnail', width: 150, height: 150 },
  { name: 'medium', width: 600, height: 400 },
  { name: 'large', width: 1200, height: 800 },
];

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${name}-${timestamp}-${random}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to upload files' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'AUTHOR') {
      return NextResponse.json(
        { error: 'You do not have permission to upload files' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = formData.get('altText') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    await ensureUploadDir();

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = generateFilename(file.name);

    // Create year/month subdirectory
    const now = new Date();
    const subDir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fullDir = path.join(UPLOAD_DIR, subDir);

    if (!existsSync(fullDir)) {
      await mkdir(fullDir, { recursive: true });
    }

    // Process and save images
    const urls: Record<string, string> = {};

    // Save original as WebP
    const originalPath = path.join(fullDir, `${filename}.webp`);
    await sharp(buffer)
      .webp({ quality: 85 })
      .toFile(originalPath);
    urls.original = `/uploads/${subDir}/${filename}.webp`;

    // Generate resized versions
    for (const size of IMAGE_SIZES) {
      const resizedPath = path.join(fullDir, `${filename}-${size.name}.webp`);
      await sharp(buffer)
        .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(resizedPath);
      urls[size.name] = `/uploads/${subDir}/${filename}-${size.name}.webp`;
    }

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    // Save to database
    const media = await prisma.media.create({
      data: {
        filename: `${filename}.webp`,
        originalName: file.name,
        mimeType: 'image/webp',
        size: file.size,
        url: urls.original,
        thumbnailUrl: urls.thumbnail,
        mediumUrl: urls.medium,
        largeUrl: urls.large,
        width: metadata.width || 0,
        height: metadata.height || 0,
        alt: altText || null,
        uploadedById: session.user.id,
      },
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'upload',
      entityType: 'media',
      entityId: media.id,
      details: { name: media.originalName, url: media.url },
    });

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        url: urls.original,
        thumbnailUrl: urls.thumbnail,
        mediumUrl: urls.medium,
        largeUrl: urls.large,
        alt: media.alt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          uploadedBy: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.media.count(),
    ]);

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get media error:', error);
    return NextResponse.json(
      { error: 'Failed to get media' },
      { status: 500 }
    );
  }
}
