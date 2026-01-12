'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Eye,
  TrendingUp,
  Calendar,
  ExternalLink,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalyticsSummary {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
}

interface TopPost {
  id: string;
  title: string;
  slug: string;
  views: number;
}

interface DailyViews {
  date: string;
  views: number;
}

interface TopReferrer {
  referrer: string;
  count: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  topPosts: TopPost[];
  dailyViews: DailyViews[];
  topReferrers: TopReferrer[];
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function SimpleBarChart({ data }: { data: DailyViews[] }) {
  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="flex items-end gap-1 h-48">
      {data.map((day, index) => {
        const height = (day.views / maxViews) * 100;
        const date = new Date(day.date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        return (
          <div
            key={day.date}
            className="flex-1 flex flex-col items-center group"
          >
            <div className="relative w-full">
              <div
                className={`w-full rounded-t transition-colors ${
                  isWeekend ? 'bg-accent/50' : 'bg-accent'
                } group-hover:bg-accent-hover`}
                style={{ height: `${Math.max(height, 2)}%`, minHeight: '2px' }}
                title={`${day.date}: ${day.views} views`}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                {day.views} views
              </div>
            </div>
            {index % 5 === 0 && (
              <span className="text-[10px] text-foreground-muted mt-1 rotate-45 origin-left">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?days=${period}`);
      if (response.ok) {
        const analyticsData: AnalyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const weeklyChange = data
    ? calculateChange(
        data.summary.weekViews,
        data.summary.monthViews - data.summary.weekViews
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-foreground-muted">Track your blog performance</p>
        </div>
        <Select value={period} onValueChange={(v: string) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <BarChart3 className="h-8 w-8 animate-pulse text-accent" />
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground-muted">
                  Total Views
                </CardTitle>
                <Eye className="h-4 w-4 text-foreground-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(data.summary.totalViews)}
                </div>
                <p className="text-xs text-foreground-muted">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground-muted">
                  Today
                </CardTitle>
                <Calendar className="h-4 w-4 text-foreground-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(data.summary.todayViews)}
                </div>
                <p className="text-xs text-foreground-muted">Page views</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground-muted">
                  This Week
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-foreground-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(data.summary.weekViews)}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {weeklyChange >= 0 ? (
                    <>
                      <ArrowUp className="h-3 w-3 text-success" />
                      <span className="text-success">+{weeklyChange.toFixed(0)}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-3 w-3 text-error" />
                      <span className="text-error">{weeklyChange.toFixed(0)}%</span>
                    </>
                  )}
                  <span className="text-foreground-muted">vs previous</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground-muted">
                  This Month
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-foreground-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(data.summary.monthViews)}
                </div>
                <p className="text-xs text-foreground-muted">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Views Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.dailyViews.length > 0 ? (
                <SimpleBarChart data={data.dailyViews} />
              ) : (
                <div className="text-center py-8 text-foreground-muted">
                  No view data available
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.topPosts.length > 0 ? (
                  <div className="space-y-4">
                    {data.topPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className="flex items-center gap-4"
                      >
                        <div className="w-6 text-center">
                          <Badge
                            variant={index < 3 ? 'default' : 'secondary'}
                            className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="font-medium hover:text-accent transition-colors line-clamp-1"
                          >
                            {post.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground-muted">
                          <Eye className="h-4 w-4" />
                          {formatNumber(post.views)}
                        </div>
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-foreground-muted hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground-muted">
                    No posts with views yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Referrers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Top Referrers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.topReferrers.length > 0 ? (
                  <div className="space-y-4">
                    {data.topReferrers.map((referrer, index) => {
                      const maxCount = data.topReferrers[0]?.count || 1;
                      const percentage = (referrer.count / maxCount) * 100;

                      return (
                        <div key={referrer.referrer} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[200px]" title={referrer.referrer}>
                              {referrer.referrer}
                            </span>
                            <span className="text-foreground-muted">
                              {formatNumber(referrer.count)}
                            </span>
                          </div>
                          <div className="h-2 bg-background-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground-muted">
                    No referrer data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
            <p className="text-foreground-muted">Failed to load analytics data</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
