'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';
import { PostStatus } from '@prisma/client';
import { logActivity } from '@/lib/activity-log';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export async function createPost(data: z.infer<typeof postSchema>) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'AUTHOR') {
    return { error: 'Unauthorized' };
  }

  const result = postSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.issues[0]?.message || 'Validation failed' };
  }

  const { title, content, excerpt, featuredImage, categoryId, tagIds, status, metaTitle, metaDescription } = result.data;

  // Generate slug from title if not provided
  let slug = result.data.slug || generateSlug(title);

  // Check if slug exists
  const existingPost = await prisma.post.findUnique({
    where: { slug },
  });

  if (existingPost) {
    slug = `${slug}-${Date.now()}`;
  }

  try {
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        featuredImage: featuredImage || null,
        categoryId: categoryId || null,
        status: status || PostStatus.DRAFT,
        authorId: session.user.id,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        tags: tagIds?.length
          ? {
              connect: tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
    });

    revalidatePath('/blog');
    revalidatePath('/admin/posts');

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: status === 'PUBLISHED' ? 'publish' : 'create',
      entityType: 'post',
      entityId: post.id,
      details: { title: post.title, slug: post.slug },
    });

    return { success: true, post };
  } catch (error) {
    console.error('Create post error:', error);
    return { error: 'Failed to create post' };
  }
}

export async function updatePost(id: string, data: z.infer<typeof postSchema>) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const existingPost = await prisma.post.findUnique({
    where: { id },
  });

  if (!existingPost) {
    return { error: 'Post not found' };
  }

  // Check permission: Admin can edit all, Author can only edit their own
  if (session.user.role !== 'ADMIN' && existingPost.authorId !== session.user.id) {
    return { error: 'Unauthorized' };
  }

  const result = postSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.issues[0]?.message || 'Validation failed' };
  }

  const { title, slug, content, excerpt, featuredImage, categoryId, tagIds, status, metaTitle, metaDescription } = result.data;

  try {
    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        slug: slug || existingPost.slug,
        content,
        excerpt: excerpt || null,
        featuredImage: featuredImage || null,
        categoryId: categoryId || null,
        status: status || existingPost.status,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        publishedAt:
          status === 'PUBLISHED' && !existingPost.publishedAt
            ? new Date()
            : existingPost.publishedAt,
        tags: tagIds !== undefined
          ? {
              set: tagIds.map((tagId) => ({ id: tagId })),
            }
          : undefined,
      },
    });

    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath('/admin/posts');

    // Determine if this was a publish action
    const wasPublished = status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED';

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: wasPublished ? 'publish' : 'update',
      entityType: 'post',
      entityId: post.id,
      details: { title: post.title, slug: post.slug },
    });

    return { success: true, post };
  } catch (error) {
    console.error('Update post error:', error);
    return { error: 'Failed to update post' };
  }
}

export async function deletePost(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const existingPost = await prisma.post.findUnique({
    where: { id },
  });

  if (!existingPost) {
    return { error: 'Post not found' };
  }

  // Check permission
  if (session.user.role !== 'ADMIN' && existingPost.authorId !== session.user.id) {
    return { error: 'Unauthorized' };
  }

  try {
    await prisma.post.delete({
      where: { id },
    });

    revalidatePath('/blog');
    revalidatePath('/admin/posts');

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'delete',
      entityType: 'post',
      entityId: id,
      details: { title: existingPost.title, slug: existingPost.slug },
    });

    return { success: true };
  } catch (error) {
    console.error('Delete post error:', error);
    return { error: 'Failed to delete post' };
  }
}

export async function getPostById(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
    },
  });

  if (!post) {
    return { error: 'Post not found' };
  }

  // Check permission
  if (session.user.role !== 'ADMIN' && post.authorId !== session.user.id) {
    return { error: 'Unauthorized' };
  }

  return { post };
}
