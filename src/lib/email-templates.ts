/**
 * Email templates for the Book of Life blog
 * All templates use a consistent design with the sci-fi dark theme
 */

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';

// Common styles for all emails
const styles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    background-color: #1C1C1E;
    color: #F5F5F5;
  `,
  header: `
    text-align: center;
    margin-bottom: 32px;
  `,
  logo: `
    font-size: 24px;
    font-weight: bold;
    background: linear-gradient(135deg, #A855F7 0%, #06B6D4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `,
  content: `
    background-color: #2C2C2E;
    border-radius: 12px;
    padding: 32px;
    margin-bottom: 24px;
  `,
  heading: `
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #F5F5F5;
  `,
  text: `
    font-size: 16px;
    line-height: 1.6;
    color: #A1A1A1;
    margin-bottom: 16px;
  `,
  button: `
    display: inline-block;
    padding: 14px 28px;
    background: linear-gradient(135deg, #A855F7 0%, #7C3AED 100%);
    color: #FFFFFF;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 16px 0;
  `,
  secondaryButton: `
    display: inline-block;
    padding: 12px 24px;
    background-color: #3A3A3C;
    color: #F5F5F5;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
  `,
  footer: `
    text-align: center;
    font-size: 14px;
    color: #6B6B6B;
    padding-top: 24px;
    border-top: 1px solid #3A3A3C;
  `,
  link: `
    color: #60A5FA;
    text-decoration: none;
  `,
  quote: `
    background-color: #3A3A3C;
    border-left: 4px solid #A855F7;
    padding: 16px;
    margin: 16px 0;
    border-radius: 0 8px 8px 0;
  `,
  code: `
    background-color: #3A3A3C;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
  `,
};

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Book of Life</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0D0D0F;">
  <div style="${styles.container}">
    <div style="${styles.header}">
      <div style="${styles.logo}">Book of Life</div>
    </div>
    ${content}
    <div style="${styles.footer}">
      <p>Book of Life - Your personal chronicle</p>
      <p><a href="${baseUrl}" style="${styles.link}">${baseUrl}</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// Email Verification
// ============================================================================

export interface VerificationEmailParams {
  name: string;
  email: string;
  token: string;
}

export function emailVerificationTemplate({
  name,
  token,
}: VerificationEmailParams): string {
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  return wrapTemplate(`
    <div style="${styles.content}">
      <h1 style="${styles.heading}">Verify Your Email</h1>
      <p style="${styles.text}">
        Hi ${name || 'there'},
      </p>
      <p style="${styles.text}">
        Welcome to Book of Life! Please verify your email address to complete your registration.
      </p>
      <div style="text-align: center;">
        <a href="${verifyUrl}" style="${styles.button}">Verify Email Address</a>
      </div>
      <p style="${styles.text}">
        Or copy and paste this link into your browser:
      </p>
      <p style="${styles.text}">
        <code style="${styles.code}">${verifyUrl}</code>
      </p>
      <p style="${styles.text}">
        This link will expire in 24 hours.
      </p>
    </div>
  `);
}

// ============================================================================
// Password Reset
// ============================================================================

export interface PasswordResetEmailParams {
  name: string;
  email: string;
  token: string;
}

export function passwordResetTemplate({
  name,
  token,
}: PasswordResetEmailParams): string {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  return wrapTemplate(`
    <div style="${styles.content}">
      <h1 style="${styles.heading}">Reset Your Password</h1>
      <p style="${styles.text}">
        Hi ${name || 'there'},
      </p>
      <p style="${styles.text}">
        We received a request to reset your password. Click the button below to create a new password.
      </p>
      <div style="text-align: center;">
        <a href="${resetUrl}" style="${styles.button}">Reset Password</a>
      </div>
      <p style="${styles.text}">
        Or copy and paste this link into your browser:
      </p>
      <p style="${styles.text}">
        <code style="${styles.code}">${resetUrl}</code>
      </p>
      <p style="${styles.text}">
        This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `);
}

// ============================================================================
// Comment Notification (to post author)
// ============================================================================

export interface CommentNotificationParams {
  authorName: string;
  commenterName: string;
  postTitle: string;
  postSlug: string;
  commentPreview: string;
}

export function commentNotificationTemplate({
  authorName,
  commenterName,
  postTitle,
  postSlug,
  commentPreview,
}: CommentNotificationParams): string {
  const postUrl = `${baseUrl}/blog/${postSlug}#comments`;

  return wrapTemplate(`
    <div style="${styles.content}">
      <h1 style="${styles.heading}">New Comment on Your Post</h1>
      <p style="${styles.text}">
        Hi ${authorName},
      </p>
      <p style="${styles.text}">
        <strong>${commenterName}</strong> left a comment on your post "<strong>${postTitle}</strong>":
      </p>
      <div style="${styles.quote}">
        <p style="margin: 0; color: #F5F5F5;">${commentPreview}</p>
      </div>
      <div style="text-align: center;">
        <a href="${postUrl}" style="${styles.button}">View Comment</a>
      </div>
    </div>
  `);
}

// ============================================================================
// Reply Notification (to original commenter)
// ============================================================================

export interface ReplyNotificationParams {
  originalCommenterName: string;
  replierName: string;
  postTitle: string;
  postSlug: string;
  originalComment: string;
  replyPreview: string;
}

export function replyNotificationTemplate({
  originalCommenterName,
  replierName,
  postTitle,
  postSlug,
  originalComment,
  replyPreview,
}: ReplyNotificationParams): string {
  const postUrl = `${baseUrl}/blog/${postSlug}#comments`;

  return wrapTemplate(`
    <div style="${styles.content}">
      <h1 style="${styles.heading}">Someone Replied to Your Comment</h1>
      <p style="${styles.text}">
        Hi ${originalCommenterName},
      </p>
      <p style="${styles.text}">
        <strong>${replierName}</strong> replied to your comment on "<strong>${postTitle}</strong>":
      </p>
      <p style="${styles.text}; font-size: 14px; color: #6B6B6B;">
        Your comment: "${originalComment.substring(0, 100)}${originalComment.length > 100 ? '...' : ''}"
      </p>
      <div style="${styles.quote}">
        <p style="margin: 0; color: #F5F5F5;">${replyPreview}</p>
      </div>
      <div style="text-align: center;">
        <a href="${postUrl}" style="${styles.button}">View Reply</a>
      </div>
    </div>
  `);
}

// ============================================================================
// Subscription Welcome
// ============================================================================

export interface SubscriptionWelcomeParams {
  name?: string;
  email: string;
  verifyToken: string;
}

export function subscriptionWelcomeTemplate({
  name,
  verifyToken,
}: SubscriptionWelcomeParams): string {
  const verifyUrl = `${baseUrl}/api/subscribe/verify?token=${verifyToken}`;
  const unsubscribeUrl = `${baseUrl}/api/subscribe/unsubscribe?token=${verifyToken}`;

  return wrapTemplate(`
    <div style="${styles.content}">
      <h1 style="${styles.heading}">Confirm Your Subscription</h1>
      <p style="${styles.text}">
        Hi ${name || 'there'},
      </p>
      <p style="${styles.text}">
        Thank you for subscribing to Book of Life! Please confirm your subscription by clicking the button below.
      </p>
      <div style="text-align: center;">
        <a href="${verifyUrl}" style="${styles.button}">Confirm Subscription</a>
      </div>
      <p style="${styles.text}">
        You'll receive notifications about new posts and updates.
      </p>
      <p style="${styles.text}; font-size: 14px;">
        If you didn't subscribe, you can <a href="${unsubscribeUrl}" style="${styles.link}">unsubscribe here</a>.
      </p>
    </div>
  `);
}

// ============================================================================
// New Post Notification (to subscribers)
// ============================================================================

export interface NewPostNotificationParams {
  subscriberName?: string;
  postTitle: string;
  postSlug: string;
  postExcerpt: string;
  authorName: string;
  unsubscribeToken: string;
}

export function newPostNotificationTemplate({
  subscriberName,
  postTitle,
  postSlug,
  postExcerpt,
  authorName,
  unsubscribeToken,
}: NewPostNotificationParams): string {
  const postUrl = `${baseUrl}/blog/${postSlug}`;
  const unsubscribeUrl = `${baseUrl}/api/subscribe/unsubscribe?token=${unsubscribeToken}`;

  return wrapTemplate(`
    <div style="${styles.content}">
      <h1 style="${styles.heading}">New Post: ${postTitle}</h1>
      <p style="${styles.text}">
        Hi ${subscriberName || 'there'},
      </p>
      <p style="${styles.text}">
        <strong>${authorName}</strong> just published a new post:
      </p>
      <div style="${styles.quote}">
        <p style="margin: 0; color: #F5F5F5;">${postExcerpt}</p>
      </div>
      <div style="text-align: center;">
        <a href="${postUrl}" style="${styles.button}">Read Post</a>
      </div>
    </div>
    <div style="text-align: center; margin-top: 16px;">
      <a href="${unsubscribeUrl}" style="${styles.link}; font-size: 14px;">Unsubscribe</a>
    </div>
  `);
}

// ============================================================================
// Contact Form Submission (to admin)
// ============================================================================

export interface ContactFormParams {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function contactFormTemplate({
  name,
  email,
  subject,
  message,
}: ContactFormParams): string {
  return wrapTemplate(`
    <div style="${styles.content}">
      <h1 style="${styles.heading}">New Contact Form Submission</h1>
      <p style="${styles.text}">
        You received a new message through the contact form:
      </p>
      <table style="width: 100%; margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #6B6B6B;">From:</td>
          <td style="padding: 8px 0; color: #F5F5F5;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B6B6B;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${email}" style="${styles.link}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B6B6B;">Subject:</td>
          <td style="padding: 8px 0; color: #F5F5F5;">${subject}</td>
        </tr>
      </table>
      <div style="${styles.quote}">
        <p style="margin: 0; color: #F5F5F5; white-space: pre-wrap;">${message}</p>
      </div>
      <div style="text-align: center;">
        <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="${styles.button}">Reply</a>
      </div>
    </div>
  `);
}

// ============================================================================
// Admin Notification - New Comment Pending
// ============================================================================

export interface PendingCommentParams {
  commenterName: string;
  commenterEmail: string;
  postTitle: string;
  postSlug: string;
  commentPreview: string;
}

export function pendingCommentTemplate({
  commenterName,
  commenterEmail,
  postTitle,
  postSlug,
  commentPreview,
}: PendingCommentParams): string {
  const moderateUrl = `${baseUrl}/admin/comments`;
  const postUrl = `${baseUrl}/blog/${postSlug}`;

  return wrapTemplate(`
    <div style="${styles.content}">
      <h1 style="${styles.heading}">New Comment Awaiting Moderation</h1>
      <p style="${styles.text}">
        A new comment requires your approval:
      </p>
      <table style="width: 100%; margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #6B6B6B;">From:</td>
          <td style="padding: 8px 0; color: #F5F5F5;">${commenterName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B6B6B;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${commenterEmail}" style="${styles.link}">${commenterEmail}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B6B6B;">Post:</td>
          <td style="padding: 8px 0;"><a href="${postUrl}" style="${styles.link}">${postTitle}</a></td>
        </tr>
      </table>
      <div style="${styles.quote}">
        <p style="margin: 0; color: #F5F5F5;">${commentPreview}</p>
      </div>
      <div style="text-align: center;">
        <a href="${moderateUrl}" style="${styles.button}">Moderate Comments</a>
      </div>
    </div>
  `);
}
