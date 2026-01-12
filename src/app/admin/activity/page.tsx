'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  Pencil,
  Trash2,
  Send,
  Archive,
  Check,
  X,
  AlertTriangle,
  Upload,
  LogIn,
  LogOut,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface ActivityResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  totalPages: number;
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4" />,
  update: <Pencil className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  publish: <Send className="h-4 w-4" />,
  archive: <Archive className="h-4 w-4" />,
  approve: <Check className="h-4 w-4" />,
  reject: <X className="h-4 w-4" />,
  spam: <AlertTriangle className="h-4 w-4" />,
  upload: <Upload className="h-4 w-4" />,
  login: <LogIn className="h-4 w-4" />,
  logout: <LogOut className="h-4 w-4" />,
  settings_update: <Settings className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  create: 'bg-success/10 text-success',
  update: 'bg-accent/10 text-accent',
  delete: 'bg-error/10 text-error',
  publish: 'bg-success/10 text-success',
  archive: 'bg-foreground-muted/10 text-foreground-muted',
  approve: 'bg-success/10 text-success',
  reject: 'bg-error/10 text-error',
  spam: 'bg-warning/10 text-warning',
  upload: 'bg-accent/10 text-accent',
  login: 'bg-success/10 text-success',
  logout: 'bg-foreground-muted/10 text-foreground-muted',
  settings_update: 'bg-accent/10 text-accent',
};

function getActivityDescription(log: ActivityLog): string {
  const entityName = (log.details?.name || log.details?.title || `a ${log.entityType}`) as string;

  const descriptions: Record<string, string> = {
    create: `Created ${log.entityType}: ${entityName}`,
    update: `Updated ${log.entityType}: ${entityName}`,
    delete: `Deleted ${log.entityType}: ${entityName}`,
    publish: `Published ${log.entityType}: ${entityName}`,
    archive: `Archived ${log.entityType}: ${entityName}`,
    approve: `Approved ${log.entityType}`,
    reject: `Rejected ${log.entityType}`,
    spam: `Marked ${log.entityType} as spam`,
    upload: `Uploaded ${log.entityType}: ${entityName}`,
    login: 'Logged in',
    logout: 'Logged out',
    settings_update: `Updated ${(log.details?.key as string) || 'settings'}`,
  };

  return descriptions[log.action] || `${log.action} ${log.entityType}`;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (entityFilter !== 'all') {
        params.set('entityType', entityFilter);
      }
      if (actionFilter !== 'all') {
        params.set('action', actionFilter);
      }

      const response = await fetch(`/api/admin/activity?${params}`);
      if (response.ok) {
        const data: ActivityResponse = await response.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityFilter, actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Log</h1>
          <p className="text-foreground-muted">Track all admin actions and changes</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {total} activities
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <label className="text-sm text-foreground-muted mb-1 block">Entity Type</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  <SelectItem value="post">Posts</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="category">Categories</SelectItem>
                  <SelectItem value="tag">Tags</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="subscriber">Subscribers</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="text-sm text-foreground-muted mb-1 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="archive">Archive</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Activity className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
              <p className="text-foreground-muted">No activity recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-background-subtle transition-colors">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-full ${actionColors[log.action] || 'bg-foreground-muted/10 text-foreground-muted'}`}
                    >
                      {actionIcons[log.action] || <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{log.user.name || log.user.email}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.entityType}
                        </Badge>
                      </div>
                      <p className="text-foreground-muted text-sm mt-1">
                        {getActivityDescription(log)}
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-foreground-muted cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs bg-background-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-sm text-foreground-muted whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
