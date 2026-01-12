import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Default settings - in production, these would be stored in the database
const defaultSettings = {
  siteTitle: 'Book of Life',
  siteDescription: 'A personal chronicle of thoughts, experiences, and stories.',
  siteUrl: process.env.NEXTAUTH_URL || '',
  authorName: 'Sarkis Haralampiev',
  authorEmail: process.env.SMTP_FROM || '',
  postsPerPage: 10,
  enableComments: true,
  moderateComments: true,
  enableNewsletter: true,
};

// In-memory store (for demo - use database in production)
let settings = { ...defaultSettings };

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate and update settings
    settings = {
      siteTitle: body.siteTitle || settings.siteTitle,
      siteDescription: body.siteDescription || settings.siteDescription,
      siteUrl: body.siteUrl || settings.siteUrl,
      authorName: body.authorName || settings.authorName,
      authorEmail: body.authorEmail || settings.authorEmail,
      postsPerPage: Math.min(50, Math.max(1, body.postsPerPage || 10)),
      enableComments: body.enableComments ?? settings.enableComments,
      moderateComments: body.moderateComments ?? settings.moderateComments,
      enableNewsletter: body.enableNewsletter ?? settings.enableNewsletter,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
