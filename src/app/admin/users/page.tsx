'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  PenTool,
  User,
  ChevronLeft,
  ChevronRight,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Role = 'ADMIN' | 'AUTHOR' | 'SUBSCRIBER';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  image: string | null;
  emailVerified: string | null;
  createdAt: string;
  _count: {
    posts: number;
    comments: number;
  };
}

interface UsersResponse {
  users: UserData[];
  total: number;
  page: number;
  totalPages: number;
}

const roleColors: Record<Role, string> = {
  ADMIN: 'bg-error/10 text-error',
  AUTHOR: 'bg-accent/10 text-accent',
  SUBSCRIBER: 'bg-foreground-muted/10 text-foreground-muted',
};

const roleIcons: Record<Role, React.ComponentType<{ className?: string }>> = {
  ADMIN: Shield,
  AUTHOR: PenTool,
  SUBSCRIBER: User,
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Role | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filter !== 'ALL') {
        params.set('role', filter);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId: string, role: Role) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-foreground-muted">Manage user accounts and roles</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'ADMIN', 'AUTHOR', 'SUBSCRIBER'] as const).map((role) => (
          <Button
            key={role}
            variant={filter === role ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter(role);
              setPage(1);
            }}
          >
            {role === 'ALL' ? 'All Users' : role}
          </Button>
        ))}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {total} Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Users className="h-8 w-8 animate-pulse text-accent" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              No users found
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => {
                const RoleIcon = roleIcons[user.role];
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-background-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {user.name || 'No name'}
                        </span>
                        <Badge className={roleColors[user.role]}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                        {user.emailVerified && (
                          <Badge variant="outline" className="text-success">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-foreground-muted">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-foreground-muted">
                        <span>{user._count.posts} posts</span>
                        <span>{user._count.comments} comments</span>
                        <span>Joined {formatDate(user.createdAt)}</span>
                      </div>
                    </div>

                    <Select
                      value={user.role}
                      onValueChange={(value: Role) => updateUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="AUTHOR">Author</SelectItem>
                        <SelectItem value="SUBSCRIBER">Subscriber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-foreground-muted">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
