import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=missing_token', request.url)
      );
    }

    // Find user with this token
    const user = await prisma.user.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_token', request.url)
      );
    }

    // Check if token is expired
    if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
      return NextResponse.redirect(
        new URL('/login?error=expired_token', request.url)
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL('/login?message=already_verified', request.url)
      );
    }

    // Verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    return NextResponse.redirect(
      new URL('/login?verified=true', request.url)
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', request.url)
    );
  }
}
