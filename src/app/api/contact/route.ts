import { NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = result.data;

    // TODO: Send email notification to admin
    // Using Mailpit in development: http://localhost:8025
    console.log('Contact form submission:', { name, email, subject, message });

    // In production, you would send an email here
    // For now, just log it

    return NextResponse.json({
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'An error occurred while sending message' },
      { status: 500 }
    );
  }
}
