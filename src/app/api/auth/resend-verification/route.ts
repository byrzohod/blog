import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { emailVerificationTemplate } from '@/lib/email-templates';

const resendSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = resendSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid email' },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json(
        { message: 'If an account exists with this email, a verification link has been sent.' },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Your email is already verified. You can log in.' },
        { status: 200 }
      );
    }

    // Generate new verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      },
    });

    // Send verification email
    const emailHtml = emailVerificationTemplate({
      name: user.name || '',
      email: user.email,
      token: verifyToken,
    });

    await sendEmail({
      to: email,
      subject: 'Verify your email - Book of Life',
      html: emailHtml,
    });

    return NextResponse.json(
      { message: 'If an account exists with this email, a verification link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
