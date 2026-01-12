import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRelatedPosts, getRelatedPostsBySlug } from '@/lib/related-posts';
import { prisma } from '@/lib/db';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('Related Posts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRelatedPosts', () => {
    const mockPosts = [
      {
        id: 'post-1',
        title: 'Same Category Post',
        slug: 'same-category-post',
        excerpt: 'A post in the same category',
        featuredImage: '/images/post1.jpg',
        publishedAt: new Date('2024-01-15'),
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Technology', slug: 'technology' },
        tags: [{ id: 'tag-1' }, { id: 'tag-2' }],
        author: { name: 'Author 1', image: null },
      },
      {
        id: 'post-2',
        title: 'Same Tags Post',
        slug: 'same-tags-post',
        excerpt: 'A post with same tags',
        featuredImage: null,
        publishedAt: new Date('2024-01-10'),
        categoryId: 'cat-2',
        category: { id: 'cat-2', name: 'Life', slug: 'life' },
        tags: [{ id: 'tag-1' }],
        author: { name: 'Author 2', image: '/avatar.jpg' },
      },
      {
        id: 'post-3',
        title: 'Unrelated Post',
        slug: 'unrelated-post',
        excerpt: 'A different post',
        featuredImage: null,
        publishedAt: new Date('2024-01-05'),
        categoryId: 'cat-3',
        category: { id: 'cat-3', name: 'Travel', slug: 'travel' },
        tags: [{ id: 'tag-3' }],
        author: { name: 'Author 3', image: null },
      },
    ];

    it('should return related posts', async () => {
      const mockFindMany = vi.mocked(prisma.post.findMany);
      mockFindMany.mockResolvedValue(mockPosts as never);

      const result = await getRelatedPosts({
        postId: 'current-post',
        categoryId: 'cat-1',
        tagIds: ['tag-1', 'tag-2'],
        limit: 3,
      });

      expect(result).toHaveLength(3);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'current-post' },
            status: 'PUBLISHED',
          }),
        })
      );
    });

    it('should prioritize posts with same category', async () => {
      const mockFindMany = vi.mocked(prisma.post.findMany);
      mockFindMany.mockResolvedValue(mockPosts as never);

      const result = await getRelatedPosts({
        postId: 'current-post',
        categoryId: 'cat-1',
        tagIds: [],
        limit: 3,
      });

      // Post with matching category should be first
      expect(result[0].id).toBe('post-1');
    });

    it('should consider posts with shared tags', async () => {
      const mockFindMany = vi.mocked(prisma.post.findMany);
      mockFindMany.mockResolvedValue(mockPosts as never);

      const result = await getRelatedPosts({
        postId: 'current-post',
        categoryId: null,
        tagIds: ['tag-1'],
        limit: 3,
      });

      // Posts with matching tags should be prioritized
      expect(result).toHaveLength(3);
    });

    it('should respect the limit parameter', async () => {
      const mockFindMany = vi.mocked(prisma.post.findMany);
      mockFindMany.mockResolvedValue(mockPosts as never);

      const result = await getRelatedPosts({
        postId: 'current-post',
        categoryId: 'cat-1',
        tagIds: ['tag-1'],
        limit: 2,
      });

      expect(result).toHaveLength(2);
    });

    it('should use default limit of 3', async () => {
      const mockFindMany = vi.mocked(prisma.post.findMany);
      mockFindMany.mockResolvedValue(mockPosts as never);

      const result = await getRelatedPosts({
        postId: 'current-post',
        categoryId: 'cat-1',
      });

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array when no posts found', async () => {
      const mockFindMany = vi.mocked(prisma.post.findMany);
      mockFindMany.mockResolvedValue([] as never);

      const result = await getRelatedPosts({
        postId: 'current-post',
        categoryId: 'cat-1',
      });

      expect(result).toEqual([]);
    });

    it('should format posts correctly', async () => {
      const mockFindMany = vi.mocked(prisma.post.findMany);
      mockFindMany.mockResolvedValue([mockPosts[0]] as never);

      const result = await getRelatedPosts({
        postId: 'current-post',
        categoryId: 'cat-1',
      });

      expect(result[0]).toEqual({
        id: 'post-1',
        title: 'Same Category Post',
        slug: 'same-category-post',
        excerpt: 'A post in the same category',
        featuredImage: '/images/post1.jpg',
        publishedAt: expect.any(Date),
        category: {
          name: 'Technology',
          slug: 'technology',
        },
        author: {
          name: 'Author 1',
          image: null,
        },
      });
    });

    it('should handle posts without category', async () => {
      const mockFindMany = vi.mocked(prisma.post.findMany);
      mockFindMany.mockResolvedValue([
        {
          ...mockPosts[0],
          category: null,
          categoryId: null,
        },
      ] as never);

      const result = await getRelatedPosts({
        postId: 'current-post',
      });

      expect(result[0].category).toBeNull();
    });
  });

  describe('getRelatedPostsBySlug', () => {
    it('should get related posts using slug', async () => {
      const mockFindUnique = vi.mocked(prisma.post.findUnique);
      const mockFindMany = vi.mocked(prisma.post.findMany);

      mockFindUnique.mockResolvedValue({
        id: 'post-1',
        slug: 'test-post',
        categoryId: 'cat-1',
        tags: [{ id: 'tag-1' }],
      } as never);

      mockFindMany.mockResolvedValue([
        {
          id: 'post-2',
          title: 'Related Post',
          slug: 'related-post',
          excerpt: 'Excerpt',
          featuredImage: null,
          publishedAt: new Date(),
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Tech', slug: 'tech' },
          tags: [{ id: 'tag-1' }],
          author: { name: 'Author', image: null },
        },
      ] as never);

      const result = await getRelatedPostsBySlug('test-post', 3);

      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'test-post' },
        })
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array if post not found', async () => {
      const mockFindUnique = vi.mocked(prisma.post.findUnique);
      mockFindUnique.mockResolvedValue(null);

      const result = await getRelatedPostsBySlug('non-existent', 3);

      expect(result).toEqual([]);
    });
  });
});
