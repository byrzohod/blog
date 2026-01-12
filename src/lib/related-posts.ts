import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
  category: {
    name: string;
    slug: string;
  } | null;
  author: {
    name: string | null;
    image: string | null;
  };
}

export interface GetRelatedPostsOptions {
  postId: string;
  categoryId?: string | null;
  tagIds?: string[];
  limit?: number;
}

/**
 * Get related posts based on category and tags
 *
 * Algorithm:
 * 1. Same category posts get highest priority (weight: 3)
 * 2. Posts with shared tags get medium priority (weight: 1 per tag)
 * 3. Recent posts are preferred
 * 4. Excludes the current post
 * 5. Returns up to `limit` posts (default: 3)
 */
export async function getRelatedPosts({
  postId,
  categoryId,
  tagIds = [],
  limit = 3,
}: GetRelatedPostsOptions): Promise<RelatedPost[]> {
  // Build conditions for related posts
  const orConditions: Prisma.PostWhereInput[] = [];

  // Add category condition if present
  if (categoryId) {
    orConditions.push({ categoryId });
  }

  // Add tag conditions if present
  if (tagIds.length > 0) {
    orConditions.push({
      tags: {
        some: {
          id: { in: tagIds },
        },
      },
    });
  }

  // Fetch candidate posts
  const candidatePosts = await prisma.post.findMany({
    where: {
      id: { not: postId }, // Exclude current post
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      ...(orConditions.length > 0 ? { OR: orConditions } : {}),
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        select: {
          id: true,
        },
      },
      author: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit * 5, // Get more candidates for scoring
  });

  // Score each post based on relevance
  const scoredPosts = candidatePosts.map((post) => {
    let score = 0;

    // Category match: +3 points
    if (categoryId && post.categoryId === categoryId) {
      score += 3;
    }

    // Tag matches: +1 point per matching tag
    if (tagIds.length > 0) {
      const postTagIds = post.tags.map((t) => t.id);
      const matchingTags = tagIds.filter((id) => postTagIds.includes(id));
      score += matchingTags.length;
    }

    // Recency bonus: posts from last 30 days get +1
    if (post.publishedAt) {
      const daysAgo = (Date.now() - post.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo <= 30) {
        score += 1;
      }
    }

    return { post, score };
  });

  // Sort by score (descending), then by date (descending)
  scoredPosts.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Secondary sort by publishedAt
    const dateA = a.post.publishedAt?.getTime() || 0;
    const dateB = b.post.publishedAt?.getTime() || 0;
    return dateB - dateA;
  });

  // Take top posts and format for return
  return scoredPosts.slice(0, limit).map(({ post }) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    publishedAt: post.publishedAt,
    category: post.category
      ? {
          name: post.category.name,
          slug: post.category.slug,
        }
      : null,
    author: {
      name: post.author.name,
      image: post.author.image,
    },
  }));
}

/**
 * Get related posts by slug (convenience function)
 */
export async function getRelatedPostsBySlug(
  slug: string,
  limit = 3
): Promise<RelatedPost[]> {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      tags: {
        select: { id: true },
      },
    },
  });

  if (!post) {
    return [];
  }

  return getRelatedPosts({
    postId: post.id,
    categoryId: post.categoryId,
    tagIds: post.tags.map((t) => t.id),
    limit,
  });
}
