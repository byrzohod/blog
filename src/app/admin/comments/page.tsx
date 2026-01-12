'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Check,
  X,
  Trash2,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

type CommentStatus = 'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH';

interface Comment {
  id: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  post: {
    id: string;
    title: string;
    slug: string;
  };
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  totalPages: number;
}

const statusColors: Record<CommentStatus, string> = {
  PENDING: 'bg-warning/10 text-warning',
  APPROVED: 'bg-success/10 text-success',
  SPAM: 'bg-error/10 text-error',
  TRASH: 'bg-foreground-muted/10 text-foreground-muted',
};

const statusLabels: Record<CommentStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  SPAM: 'Spam',
  TRASH: 'Trash',
};

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<CommentStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filter !== 'ALL') {
        params.set('status', filter);
      }

      const response = await fetch(`/api/admin/comments?${params}`);
      if (response.ok) {
        const data: CommentsResponse = await response.json();
        setComments(data.comments);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const updateCommentStatus = async (id: string, status: CommentStatus) => {
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const deleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const bulkUpdateStatus = async (status: CommentStatus) => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/comments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
        )
      );
      setSelectedIds([]);
      fetchComments();
    } catch (error) {
      console.error('Failed to bulk update comments:', error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === comments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(comments.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comments</h1>
        <p className="text-foreground-muted">Moderate and manage comments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'PENDING', 'APPROVED', 'SPAM', 'TRASH'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter(status);
              setPage(1);
            }}
          >
            {status === 'ALL' ? 'All' : statusLabels[status]}
          </Button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-background-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => bulkUpdateStatus('APPROVED')}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => bulkUpdateStatus('SPAM')}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Spam
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => bulkUpdateStatus('TRASH')}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Trash
          </Button>
        </div>
      )}

      {/* Comments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {total} Comments
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <MessageSquare className="h-8 w-8 animate-pulse text-accent" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              No comments found
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={selectedIds.length === comments.length && comments.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-foreground-muted">Select all</span>
              </div>

              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-4 p-4 border rounded-lg hover:bg-background-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.includes(comment.id)}
                    onCheckedChange={() => toggleSelect(comment.id)}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {comment.author.name || comment.author.email}
                          </span>
                          <Badge className={statusColors[comment.status]}>
                            {statusLabels[comment.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground-muted">
                          on{' '}
                          <Link
                            href={`/blog/${comment.post.slug}`}
                            className="text-accent hover:underline"
                          >
                            {comment.post.title}
                          </Link>
                        </p>
                      </div>
                      <span className="text-xs text-foreground-muted whitespace-nowrap">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm line-clamp-3">{comment.content}</p>

                    <div className="flex items-center gap-2 mt-3">
                      {comment.status !== 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateCommentStatus(comment.id, 'APPROVED')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {comment.status !== 'SPAM' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateCommentStatus(comment.id, 'SPAM')}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Spam
                        </Button>
                      )}
                      {comment.status !== 'TRASH' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateCommentStatus(comment.id, 'TRASH')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Trash
                        </Button>
                      )}
                      {comment.status === 'TRASH' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-error"
                          onClick={() => deleteComment(comment.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Permanently
                        </Button>
                      )}
                      <Link
                        href={`/blog/${comment.post.slug}#comment-${comment.id}`}
                        className="ml-auto"
                      >
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
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
