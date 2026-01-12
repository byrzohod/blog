import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logActivity, getActivityLogs, getActivityDescription, getActivityIcon, getActivityColor } from '@/lib/activity-log';
import { prisma } from '@/lib/db';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    activityLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Activity Log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logActivity', () => {
    it('should create an activity log entry', async () => {
      const mockCreate = vi.mocked(prisma.activityLog.create);
      mockCreate.mockResolvedValue({
        id: 'log-1',
        userId: 'user-1',
        action: 'create',
        entityType: 'post',
        entityId: 'post-1',
        details: { title: 'Test Post' },
        createdAt: new Date(),
      });

      await logActivity({
        userId: 'user-1',
        action: 'create',
        entityType: 'post',
        entityId: 'post-1',
        details: { title: 'Test Post' },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'create',
          entityType: 'post',
          entityId: 'post-1',
          details: { title: 'Test Post' },
        },
      });
    });

    it('should handle missing optional fields', async () => {
      const mockCreate = vi.mocked(prisma.activityLog.create);
      mockCreate.mockResolvedValue({
        id: 'log-1',
        userId: 'user-1',
        action: 'login',
        entityType: 'user',
        entityId: null,
        details: null,
        createdAt: new Date(),
      });

      await logActivity({
        userId: 'user-1',
        action: 'login',
        entityType: 'user',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'login',
          entityType: 'user',
          entityId: undefined,
          details: undefined,
        },
      });
    });

    it('should not throw on database error', async () => {
      const mockCreate = vi.mocked(prisma.activityLog.create);
      mockCreate.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      await expect(
        logActivity({
          userId: 'user-1',
          action: 'create',
          entityType: 'post',
          entityId: 'post-1',
        })
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getActivityLogs', () => {
    const mockLogs = [
      {
        id: 'log-1',
        action: 'create',
        entityType: 'post',
        entityId: 'post-1',
        details: { title: 'Test Post' },
        createdAt: new Date(),
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
      },
    ];

    it('should return paginated activity logs', async () => {
      const mockFindMany = vi.mocked(prisma.activityLog.findMany);
      const mockCount = vi.mocked(prisma.activityLog.count);

      mockFindMany.mockResolvedValue(mockLogs as never);
      mockCount.mockResolvedValue(1);

      const result = await getActivityLogs({ page: 1, limit: 20 });

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by userId', async () => {
      const mockFindMany = vi.mocked(prisma.activityLog.findMany);
      const mockCount = vi.mocked(prisma.activityLog.count);

      mockFindMany.mockResolvedValue(mockLogs as never);
      mockCount.mockResolvedValue(1);

      await getActivityLogs({ userId: 'user-1' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        })
      );
    });

    it('should filter by entityType', async () => {
      const mockFindMany = vi.mocked(prisma.activityLog.findMany);
      const mockCount = vi.mocked(prisma.activityLog.count);

      mockFindMany.mockResolvedValue(mockLogs as never);
      mockCount.mockResolvedValue(1);

      await getActivityLogs({ entityType: 'post' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityType: 'post' }),
        })
      );
    });

    it('should filter by action', async () => {
      const mockFindMany = vi.mocked(prisma.activityLog.findMany);
      const mockCount = vi.mocked(prisma.activityLog.count);

      mockFindMany.mockResolvedValue(mockLogs as never);
      mockCount.mockResolvedValue(1);

      await getActivityLogs({ action: 'create' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: 'create' }),
        })
      );
    });

    it('should filter by date range', async () => {
      const mockFindMany = vi.mocked(prisma.activityLog.findMany);
      const mockCount = vi.mocked(prisma.activityLog.count);

      mockFindMany.mockResolvedValue(mockLogs as never);
      mockCount.mockResolvedValue(1);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await getActivityLogs({ startDate, endDate });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should calculate correct pagination', async () => {
      const mockFindMany = vi.mocked(prisma.activityLog.findMany);
      const mockCount = vi.mocked(prisma.activityLog.count);

      mockFindMany.mockResolvedValue(mockLogs as never);
      mockCount.mockResolvedValue(45);

      const result = await getActivityLogs({ page: 2, limit: 20 });

      expect(result.totalPages).toBe(3);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });
  });

  describe('getActivityDescription', () => {
    it('should return correct description for create action', () => {
      const description = getActivityDescription('create', 'post', { title: 'My Post' });
      expect(description).toBe('Created post: My Post');
    });

    it('should return correct description for update action', () => {
      const description = getActivityDescription('update', 'category', { name: 'Technology' });
      expect(description).toBe('Updated category: Technology');
    });

    it('should return correct description for delete action', () => {
      const description = getActivityDescription('delete', 'tag', { name: 'javascript' });
      expect(description).toBe('Deleted tag: javascript');
    });

    it('should return correct description for publish action', () => {
      const description = getActivityDescription('publish', 'post', { title: 'Published Post' });
      expect(description).toBe('Published post: Published Post');
    });

    it('should return correct description for login action', () => {
      const description = getActivityDescription('login', 'user');
      expect(description).toBe('Logged in');
    });

    it('should return correct description for logout action', () => {
      const description = getActivityDescription('logout', 'user');
      expect(description).toBe('Logged out');
    });

    it('should return correct description for settings_update action', () => {
      const description = getActivityDescription('settings_update', 'settings', { key: 'site_title' });
      expect(description).toBe('Updated site_title');
    });

    it('should handle missing details', () => {
      const description = getActivityDescription('create', 'post');
      expect(description).toBe('Created post: a post');
    });
  });

  describe('getActivityIcon', () => {
    it('should return correct icon for each action', () => {
      expect(getActivityIcon('create')).toBe('plus');
      expect(getActivityIcon('update')).toBe('pencil');
      expect(getActivityIcon('delete')).toBe('trash');
      expect(getActivityIcon('publish')).toBe('send');
      expect(getActivityIcon('archive')).toBe('archive');
      expect(getActivityIcon('approve')).toBe('check');
      expect(getActivityIcon('reject')).toBe('x');
      expect(getActivityIcon('spam')).toBe('alert-triangle');
      expect(getActivityIcon('upload')).toBe('upload');
      expect(getActivityIcon('login')).toBe('log-in');
      expect(getActivityIcon('logout')).toBe('log-out');
      expect(getActivityIcon('settings_update')).toBe('settings');
    });
  });

  describe('getActivityColor', () => {
    it('should return correct color for each action', () => {
      expect(getActivityColor('create')).toBe('text-success');
      expect(getActivityColor('update')).toBe('text-accent');
      expect(getActivityColor('delete')).toBe('text-error');
      expect(getActivityColor('publish')).toBe('text-success');
      expect(getActivityColor('approve')).toBe('text-success');
      expect(getActivityColor('reject')).toBe('text-error');
      expect(getActivityColor('spam')).toBe('text-warning');
      expect(getActivityColor('upload')).toBe('text-accent');
      expect(getActivityColor('login')).toBe('text-success');
      expect(getActivityColor('logout')).toBe('text-foreground-muted');
    });
  });
});
