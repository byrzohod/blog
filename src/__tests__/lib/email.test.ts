import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock nodemailer before importing email module
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: vi.fn().mockResolvedValue(true),
    })),
  },
}));

import { sendEmail, sendAdminEmail, verifyEmailConnection } from '@/lib/email';
import {
  emailVerificationTemplate,
  passwordResetTemplate,
  commentNotificationTemplate,
  replyNotificationTemplate,
  subscriptionWelcomeTemplate,
  newPostNotificationTemplate,
  contactFormTemplate,
  pendingCommentTemplate,
} from '@/lib/email-templates';

describe('Email Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
    });

    it('should include text version when not provided', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
    });

    it('should use provided text version', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Plain text content',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendAdminEmail', () => {
    it('should send email to admin address', async () => {
      const result = await sendAdminEmail({
        subject: 'Admin Notification',
        html: '<p>Admin content</p>',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('verifyEmailConnection', () => {
    it('should return true when connection is valid', async () => {
      const result = await verifyEmailConnection();
      expect(result).toBe(true);
    });
  });
});

describe('Email Templates', () => {
  describe('emailVerificationTemplate', () => {
    it('should generate verification email with correct content', () => {
      const html = emailVerificationTemplate({
        name: 'John Doe',
        email: 'john@example.com',
        token: 'test-token-123',
      });

      expect(html).toContain('Verify Your Email');
      expect(html).toContain('Hi John Doe');
      expect(html).toContain('test-token-123');
      expect(html).toContain('verify-email');
    });

    it('should handle missing name gracefully', () => {
      const html = emailVerificationTemplate({
        name: '',
        email: 'john@example.com',
        token: 'test-token-123',
      });

      expect(html).toContain('Hi there');
    });
  });

  describe('passwordResetTemplate', () => {
    it('should generate password reset email with correct content', () => {
      const html = passwordResetTemplate({
        name: 'Jane Doe',
        email: 'jane@example.com',
        token: 'reset-token-456',
      });

      expect(html).toContain('Reset Your Password');
      expect(html).toContain('Hi Jane Doe');
      expect(html).toContain('reset-token-456');
      expect(html).toContain('reset-password');
    });

    it('should include expiry warning', () => {
      const html = passwordResetTemplate({
        name: 'Jane Doe',
        email: 'jane@example.com',
        token: 'reset-token-456',
      });

      expect(html).toContain('expire');
    });
  });

  describe('commentNotificationTemplate', () => {
    it('should generate comment notification with correct content', () => {
      const html = commentNotificationTemplate({
        authorName: 'Post Author',
        commenterName: 'Commenter',
        postTitle: 'Amazing Post',
        postSlug: 'amazing-post',
        commentPreview: 'Great article!',
      });

      expect(html).toContain('New Comment on Your Post');
      expect(html).toContain('Post Author');
      expect(html).toContain('Commenter');
      expect(html).toContain('Amazing Post');
      expect(html).toContain('Great article!');
      expect(html).toContain('amazing-post');
    });
  });

  describe('replyNotificationTemplate', () => {
    it('should generate reply notification with correct content', () => {
      const html = replyNotificationTemplate({
        originalCommenterName: 'Original Commenter',
        replierName: 'Replier',
        postTitle: 'Discussion Post',
        postSlug: 'discussion-post',
        originalComment: 'My original thought about this topic',
        replyPreview: 'I agree with your point!',
      });

      expect(html).toContain('Someone Replied to Your Comment');
      expect(html).toContain('Original Commenter');
      expect(html).toContain('Replier');
      expect(html).toContain('Discussion Post');
      expect(html).toContain('I agree with your point!');
    });

    it('should truncate long original comments', () => {
      const longComment = 'A'.repeat(150);
      const html = replyNotificationTemplate({
        originalCommenterName: 'Original Commenter',
        replierName: 'Replier',
        postTitle: 'Post',
        postSlug: 'post',
        originalComment: longComment,
        replyPreview: 'Reply',
      });

      expect(html).toContain('...');
    });
  });

  describe('subscriptionWelcomeTemplate', () => {
    it('should generate subscription welcome email with correct content', () => {
      const html = subscriptionWelcomeTemplate({
        name: 'New Subscriber',
        email: 'subscriber@example.com',
        verifyToken: 'verify-sub-token',
      });

      expect(html).toContain('Confirm Your Subscription');
      expect(html).toContain('New Subscriber');
      expect(html).toContain('verify-sub-token');
      expect(html).toContain('subscribe/verify');
    });

    it('should include unsubscribe link', () => {
      const html = subscriptionWelcomeTemplate({
        name: 'Subscriber',
        email: 'sub@example.com',
        verifyToken: 'token',
      });

      expect(html).toContain('unsubscribe');
    });
  });

  describe('newPostNotificationTemplate', () => {
    it('should generate new post notification with correct content', () => {
      const html = newPostNotificationTemplate({
        subscriberName: 'Reader',
        postTitle: 'New Amazing Post',
        postSlug: 'new-amazing-post',
        postExcerpt: 'This is an excerpt of the new post...',
        authorName: 'Author Name',
        unsubscribeToken: 'unsub-token',
      });

      expect(html).toContain('New Post: New Amazing Post');
      expect(html).toContain('Reader');
      expect(html).toContain('Author Name');
      expect(html).toContain('This is an excerpt');
      expect(html).toContain('new-amazing-post');
      expect(html).toContain('Unsubscribe');
    });
  });

  describe('contactFormTemplate', () => {
    it('should generate contact form email with correct content', () => {
      const html = contactFormTemplate({
        name: 'Contact Person',
        email: 'contact@example.com',
        subject: 'Question about the blog',
        message: 'I have a question about...',
      });

      expect(html).toContain('New Contact Form Submission');
      expect(html).toContain('Contact Person');
      expect(html).toContain('contact@example.com');
      expect(html).toContain('Question about the blog');
      expect(html).toContain('I have a question about...');
    });

    it('should include reply mailto link', () => {
      const html = contactFormTemplate({
        name: 'Person',
        email: 'person@example.com',
        subject: 'Subject',
        message: 'Message',
      });

      expect(html).toContain('mailto:person@example.com');
    });
  });

  describe('pendingCommentTemplate', () => {
    it('should generate pending comment notification with correct content', () => {
      const html = pendingCommentTemplate({
        commenterName: 'New Commenter',
        commenterEmail: 'commenter@example.com',
        postTitle: 'Blog Post',
        postSlug: 'blog-post',
        commentPreview: 'This is a comment that needs approval',
      });

      expect(html).toContain('New Comment Awaiting Moderation');
      expect(html).toContain('New Commenter');
      expect(html).toContain('commenter@example.com');
      expect(html).toContain('Blog Post');
      expect(html).toContain('This is a comment that needs approval');
      expect(html).toContain('Moderate Comments');
    });
  });

  describe('Template Structure', () => {
    it('should include Book of Life branding in all templates', () => {
      const templates = [
        emailVerificationTemplate({ name: 'Test', email: 'test@test.com', token: 'token' }),
        passwordResetTemplate({ name: 'Test', email: 'test@test.com', token: 'token' }),
        subscriptionWelcomeTemplate({ email: 'test@test.com', verifyToken: 'token' }),
      ];

      templates.forEach(html => {
        expect(html).toContain('Book of Life');
        expect(html).toContain('<!DOCTYPE html>');
      });
    });

    it('should use consistent dark theme colors', () => {
      const html = emailVerificationTemplate({
        name: 'Test',
        email: 'test@test.com',
        token: 'token',
      });

      // Check for dark theme background colors
      expect(html).toContain('#1C1C1E');
      expect(html).toContain('#2C2C2E');
    });
  });
});
