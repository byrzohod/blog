import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { checkSpam, sanitizeContent } from '@/lib/spam-filter';
import { sendEmail } from '@/lib/email';
import {
  commentNotificationTemplate,
  replyNotificationTemplate,
} from '@/lib/email-templates';

const commentSchema = z.object({
  postId: z.string(),
  parentId: z.string().optional(),
  content: z.string().min(1).max(1000),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to comment' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = commentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { postId, parentId, content } = result.data;

    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeContent(content);

    // Check for spam
    const spamResult = await checkSpam({
      content: sanitizedContent,
      authorEmail: session.user.email || undefined,
      authorId: session.user.id,
    });

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId, status: 'PUBLISHED' },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check settings for comment moderation
    const moderationSetting = await prisma.setting.findUnique({
      where: { key: 'require_comment_approval' },
    });

    const requiresApproval = moderationSetting?.value === 'true';

    // Determine comment status based on spam check and moderation settings
    let commentStatus: 'PENDING' | 'APPROVED' | 'SPAM' = 'APPROVED';

    if (spamResult.isSpam) {
      commentStatus = 'SPAM';
    } else if (requiresApproval) {
      commentStatus = 'PENDING';
    }

    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        postId,
        parentId: parentId || null,
        authorId: session.user.id,
        status: commentStatus,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Return different response based on status
    if (commentStatus === 'SPAM') {
      // Don't tell user it's spam (to prevent spam detection gaming)
      return NextResponse.json(
        { comment, message: 'Your comment is pending moderation' },
        { status: 201 }
      );
    }

    if (commentStatus === 'PENDING') {
      return NextResponse.json(
        { comment, message: 'Your comment is pending moderation' },
        { status: 201 }
      );
    }

    // Send notifications for approved comments (async, don't wait)
    if (commentStatus === 'APPROVED') {
      sendCommentNotifications({
        comment,
        post,
        parentId: parentId || null,
        commenterId: session.user.id,
        commenterName: comment.author.name || 'Someone',
      }).catch(err => console.error('Notification error:', err));
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json(
      { error: 'An error occurred while posting comment' },
      { status: 500 }
    );
  }
}

// Helper function to send comment notifications
async function sendCommentNotifications({
  comment,
  post,
  parentId,
  commenterId,
  commenterName,
}: {
  comment: { id: string; content: string };
  post: { id: string; title: string; slug: string; authorId: string };
  parentId: string | null;
  commenterId: string;
  commenterName: string;
}) {
  try {
    // Get post author details
    const postAuthor = await prisma.user.findUnique({
      where: { id: post.authorId },
      select: { email: true, name: true, notifyOnComment: true },
    });

    // If it's a reply, notify the parent comment author
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: {
          author: {
            select: { id: true, email: true, name: true, notifyOnReply: true },
          },
        },
      });

      // Don't notify if replying to own comment
      if (parentComment && parentComment.author.id !== commenterId && parentComment.author.notifyOnReply) {
        const replyHtml = replyNotificationTemplate({
          originalCommenterName: parentComment.author.name || 'Someone',
          replierName: commenterName,
          postTitle: post.title,
          postSlug: post.slug,
          originalComment: parentComment.content,
          replyPreview: comment.content.substring(0, 200),
        });

        await sendEmail({
          to: parentComment.author.email,
          subject: `New reply to your comment on "${post.title}"`,
          html: replyHtml,
        });
      }
    }

    // Notify post author (if not the commenter and if notifications are enabled)
    if (postAuthor && postAuthor.notifyOnComment && post.authorId !== commenterId) {
      const commentHtml = commentNotificationTemplate({
        authorName: postAuthor.name || 'Author',
        commenterName,
        postTitle: post.title,
        postSlug: post.slug,
        commentPreview: comment.content.substring(0, 200),
      });

      await sendEmail({
        to: postAuthor.email,
        subject: `New comment on "${post.title}"`,
        html: commentHtml,
      });
    }
  } catch (error) {
    console.error('Failed to send comment notifications:', error);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');

  if (!postId) {
    return NextResponse.json(
      { error: 'Post ID is required' },
      { status: 400 }
    );
  }

  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        status: 'APPROVED',
        parentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          where: { status: 'APPROVED' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
