import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  secure: process.env.SMTP_SECURE === 'true',
  ...(process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }
    : {}),
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using the configured SMTP transport
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@localhost',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send email to admin
 */
export async function sendAdminEmail({
  subject,
  html,
  text,
}: Omit<SendEmailOptions, 'to'>): Promise<SendEmailResult> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@localhost';
  return sendEmail({ to: adminEmail, subject, html, text });
}

/**
 * Verify SMTP connection (useful for health checks)
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
