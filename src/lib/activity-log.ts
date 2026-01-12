import { prisma } from '@/lib/db';

export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'archive'
  | 'approve'
  | 'reject'
  | 'spam'
  | 'upload'
  | 'login'
  | 'logout'
  | 'settings_update';

export type EntityType =
  | 'post'
  | 'comment'
  | 'category'
  | 'tag'
  | 'media'
  | 'user'
  | 'subscriber'
  | 'settings';

export interface LogActivityInput {
  userId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, unknown>;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: unknown;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

/**
 * Log an activity to the database
 */
export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  details,
}: LogActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      },
    });
  } catch (error) {
    // Don't throw - activity logging should not break main functionality
    console.error('Failed to log activity:', error);
  }
}

/**
 * Get paginated activity logs
 */
export async function getActivityLogs({
  page = 1,
  limit = 20,
  userId,
  entityType,
  action,
  startDate,
  endDate,
}: {
  page?: number;
  limit?: number;
  userId?: string;
  entityType?: EntityType;
  action?: ActivityAction;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  logs: ActivityLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const where: Record<string, unknown> = {};

  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get human-readable description of an activity
 */
export function getActivityDescription(
  action: ActivityAction,
  entityType: EntityType,
  details?: Record<string, unknown>
): string {
  const entityName = details?.name || details?.title || `a ${entityType}`;

  const descriptions: Record<ActivityAction, string> = {
    create: `Created ${entityType}: ${entityName}`,
    update: `Updated ${entityType}: ${entityName}`,
    delete: `Deleted ${entityType}: ${entityName}`,
    publish: `Published ${entityType}: ${entityName}`,
    archive: `Archived ${entityType}: ${entityName}`,
    approve: `Approved ${entityType}`,
    reject: `Rejected ${entityType}`,
    spam: `Marked ${entityType} as spam`,
    upload: `Uploaded ${entityType}: ${entityName}`,
    login: 'Logged in',
    logout: 'Logged out',
    settings_update: `Updated ${details?.key || 'settings'}`,
  };

  return descriptions[action] || `${action} ${entityType}`;
}

/**
 * Get icon name for activity type
 */
export function getActivityIcon(action: ActivityAction): string {
  const icons: Record<ActivityAction, string> = {
    create: 'plus',
    update: 'pencil',
    delete: 'trash',
    publish: 'send',
    archive: 'archive',
    approve: 'check',
    reject: 'x',
    spam: 'alert-triangle',
    upload: 'upload',
    login: 'log-in',
    logout: 'log-out',
    settings_update: 'settings',
  };

  return icons[action] || 'activity';
}

/**
 * Get color for activity type
 */
export function getActivityColor(action: ActivityAction): string {
  const colors: Record<ActivityAction, string> = {
    create: 'text-success',
    update: 'text-accent',
    delete: 'text-error',
    publish: 'text-success',
    archive: 'text-foreground-muted',
    approve: 'text-success',
    reject: 'text-error',
    spam: 'text-warning',
    upload: 'text-accent',
    login: 'text-success',
    logout: 'text-foreground-muted',
    settings_update: 'text-accent',
  };

  return colors[action] || 'text-foreground-muted';
}
