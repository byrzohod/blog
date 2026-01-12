import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Check if user exists with this email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with that email, we have sent instructions to reset your password.',
      });
    }

    // Delete any existing password reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    // Save the token to database
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires,
      },
    });

    // In a production app, you would send an email here
    // For now, we'll log the reset link (in development)
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset link:', resetUrl);
    }

    // TODO: Implement actual email sending
    // await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({
      message: 'If an account exists with that email, we have sent instructions to reset your password.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
