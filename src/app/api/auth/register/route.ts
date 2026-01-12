import { hash } from 'bcryptjs';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { emailVerificationTemplate } from '@/lib/email-templates';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const issues = result.error.issues;
      return NextResponse.json(
        { error: issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with SUBSCRIBER role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'SUBSCRIBER',
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
      {
        message: 'Account created successfully. Please check your email to verify your account.',
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
