import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
  notifyNewPosts: z.boolean().default(true),
  notifyNewsletter: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { email, name, notifyNewPosts, notifyNewsletter } = result.data;

    // Check if already subscribed
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      if (existingSubscriber.isVerified) {
        return NextResponse.json(
          { error: 'This email is already subscribed' },
          { status: 400 }
        );
      }

      // Resend verification
      return NextResponse.json({
        message: 'Verification email resent. Please check your inbox.',
      });
    }

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // Create subscriber
    await prisma.subscriber.create({
      data: {
        email,
        name,
        verifyToken,
        notifyNewPosts,
        notifyNewsletter,
      },
    });

    // TODO: Send verification email
    // In development, you can use Mailpit at http://localhost:8025

    return NextResponse.json({
      message: 'Please check your email to confirm your subscription.',
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'An error occurred while subscribing' },
      { status: 500 }
    );
  }
}
