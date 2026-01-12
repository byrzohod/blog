'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  verifiedAt: string | null;
  isVerified: boolean;
}

interface SubscribersResponse {
  subscribers: Subscriber[];
  total: number;
  page: number;
  totalPages: number;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/admin/subscribers?${params}`);
      if (response.ok) {
        const data: SubscribersResponse = await response.json();
        setSubscribers(data.subscribers);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const deleteSubscriber = async (id: string) => {
    if (!confirm('Are you sure you want to remove this subscriber?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/subscribers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSubscribers();
      }
    } catch (error) {
      console.error('Failed to delete subscriber:', error);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedIds.length} subscribers?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/admin/subscribers/${id}`, {
            method: 'DELETE',
          })
        )
      );
      setSelectedIds([]);
      fetchSubscribers();
    } catch (error) {
      console.error('Failed to bulk delete subscribers:', error);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Email', 'Subscribed At', 'Verified'],
      ...subscribers.map((s) => [
        s.email,
        new Date(s.subscribedAt).toISOString(),
        s.isVerified ? 'Yes' : 'No',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === subscribers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(subscribers.map((s) => s.id));
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
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscribers</h1>
          <p className="text-foreground-muted">Manage email newsletter subscribers</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
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
            className="text-error"
            onClick={bulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove Selected
          </Button>
        </div>
      )}

      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {total} Subscribers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Mail className="h-8 w-8 animate-pulse text-accent" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              No subscribers yet
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center gap-4 p-3 bg-background-muted rounded-lg font-medium text-sm">
                <Checkbox
                  checked={selectedIds.length === subscribers.length && subscribers.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="flex-1">Email</span>
                <span className="w-32">Subscribed</span>
                <span className="w-24">Status</span>
                <span className="w-20"></span>
              </div>

              {subscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-background-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.includes(subscriber.id)}
                    onCheckedChange={() => toggleSelect(subscriber.id)}
                  />
                  <span className="flex-1 truncate">{subscriber.email}</span>
                  <span className="w-32 text-sm text-foreground-muted">
                    {formatDate(subscriber.subscribedAt)}
                  </span>
                  <span className="w-24">
                    {subscriber.isVerified ? (
                      <Badge className="bg-success/10 text-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </span>
                  <div className="w-20 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-error"
                      onClick={() => deleteSubscriber(subscriber.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
