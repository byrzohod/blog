import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trackPageView,
  getAnalyticsSummary,
  getTopPosts,
  getDailyViews,
  getTopReferrers,
  getPostViews,
  generateSessionId,
} from '@/lib/analytics';
import { prisma } from '@/lib/db';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    pageView: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    post: {
      findMany: vi.fn(),
    },
  },
}));

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackPageView', () => {
    it('should create a page view', async () => {
      const mockFindFirst = vi.mocked(prisma.pageView.findFirst);
      const mockCreate = vi.mocked(prisma.pageView.create);

      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'view-1',
        postId: 'post-1',
        path: '/blog/test-post',
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session-123',
        createdAt: new Date(),
      });

      await trackPageView({
        postId: 'post-1',
        path: '/blog/test-post',
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session-123',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          postId: 'post-1',
          path: '/blog/test-post',
          referrer: 'https://google.com',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-123',
        },
      });
    });

    it('should not create duplicate view within 30 minutes', async () => {
      const mockFindFirst = vi.mocked(prisma.pageView.findFirst);
      const mockCreate = vi.mocked(prisma.pageView.create);

      mockFindFirst.mockResolvedValue({
        id: 'existing-view',
        postId: 'post-1',
        path: '/blog/test-post',
        referrer: null,
        userAgent: null,
        sessionId: 'session-123',
        createdAt: new Date(),
      });

      await trackPageView({
        path: '/blog/test-post',
        sessionId: 'session-123',
      });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should handle null postId', async () => {
      const mockFindFirst = vi.mocked(prisma.pageView.findFirst);
      const mockCreate = vi.mocked(prisma.pageView.create);

      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'view-1',
        postId: null,
        path: '/about',
        referrer: null,
        userAgent: null,
        sessionId: 'session-123',
        createdAt: new Date(),
      });

      await trackPageView({
        path: '/about',
        sessionId: 'session-123',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          postId: null,
          path: '/about',
        }),
      });
    });

    it('should not throw on error', async () => {
      const mockFindFirst = vi.mocked(prisma.pageView.findFirst);
      mockFindFirst.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        trackPageView({
          path: '/test',
          sessionId: 'session-123',
        })
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should return analytics summary', async () => {
      const mockCount = vi.mocked(prisma.pageView.count);
      mockCount
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(50) // today
        .mockResolvedValueOnce(350) // week
        .mockResolvedValueOnce(1000); // month

      const result = await getAnalyticsSummary();

      expect(result).toEqual({
        totalViews: 1000,
        todayViews: 50,
        weekViews: 350,
        monthViews: 1000,
      });
    });
  });

  describe('getTopPosts', () => {
    it('should return top posts by views', async () => {
      const mockGroupBy = vi.mocked(prisma.pageView.groupBy);
      const mockFindMany = vi.mocked(prisma.post.findMany);

      mockGroupBy.mockResolvedValue([
        { postId: 'post-1', _count: { postId: 100 } },
        { postId: 'post-2', _count: { postId: 50 } },
      ] as never);

      mockFindMany.mockResolvedValue([
        { id: 'post-1', title: 'Popular Post', slug: 'popular-post' },
        { id: 'post-2', title: 'Another Post', slug: 'another-post' },
      ] as never);

      const result = await getTopPosts(10, 30);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'post-1',
        title: 'Popular Post',
        slug: 'popular-post',
        views: 100,
      });
    });

    it('should handle empty results', async () => {
      const mockGroupBy = vi.mocked(prisma.pageView.groupBy);
      mockGroupBy.mockResolvedValue([] as never);

      const result = await getTopPosts(10, 30);

      expect(result).toEqual([]);
    });
  });

  describe('getDailyViews', () => {
    it('should return daily views for the specified period', async () => {
      const mockFindMany = vi.mocked(prisma.pageView.findMany);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      mockFindMany.mockResolvedValue([
        { createdAt: today },
        { createdAt: today },
        { createdAt: yesterday },
      ] as never);

      const result = await getDailyViews(7);

      // Implementation returns days + 1 entries (from startDate to today inclusive)
      // Due to how dates span midnight, this can be days + 1 or days + 2
      expect(result.length).toBeGreaterThanOrEqual(8);
      expect(result.length).toBeLessThanOrEqual(9);
      expect(result.some((d) => d.views > 0)).toBe(true);
    });

    it('should initialize all days with zero', async () => {
      const mockFindMany = vi.mocked(prisma.pageView.findMany);
      mockFindMany.mockResolvedValue([]);

      const result = await getDailyViews(7);

      expect(result.every((d) => d.views === 0)).toBe(true);
    });
  });

  describe('getTopReferrers', () => {
    it('should return top referrers', async () => {
      const mockGroupBy = vi.mocked(prisma.pageView.groupBy);

      mockGroupBy.mockResolvedValue([
        { referrer: 'https://google.com', _count: { referrer: 50 } },
        { referrer: 'https://twitter.com', _count: { referrer: 30 } },
      ] as never);

      const result = await getTopReferrers(10, 30);

      expect(result).toEqual([
        { referrer: 'https://google.com', count: 50 },
        { referrer: 'https://twitter.com', count: 30 },
      ]);
    });
  });

  describe('getPostViews', () => {
    it('should return view count for a post', async () => {
      const mockCount = vi.mocked(prisma.pageView.count);
      mockCount.mockResolvedValue(42);

      const result = await getPostViews('post-1', 30);

      expect(result).toBe(42);
      expect(mockCount).toHaveBeenCalledWith({
        where: {
          postId: 'post-1',
          createdAt: { gte: expect.any(Date) },
        },
      });
    });
  });

  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });
});
