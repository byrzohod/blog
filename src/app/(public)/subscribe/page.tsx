'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Rss, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
  notifyNewPosts: z.boolean(),
  notifyNewsletter: z.boolean(),
});

type SubscribeForm = z.infer<typeof subscribeSchema>;

export default function SubscribePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SubscribeForm>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      notifyNewPosts: true,
      notifyNewsletter: true,
    },
  });

  const notifyNewPosts = watch('notifyNewPosts');
  const notifyNewsletter = watch('notifyNewsletter');

  const onSubmit = async (data: SubscribeForm) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Something went wrong');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-prose py-12">
      <h1 className="text-4xl font-bold mb-4">Subscribe</h1>
      <p className="text-foreground-muted text-lg mb-8">
        Stay updated with the latest posts from Book of Life.
      </p>

      <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
        {/* Email Subscription */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" />
              <CardTitle>Email Subscription</CardTitle>
            </div>
            <CardDescription>
              Get notified when new posts are published.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="p-4 rounded-md bg-success/10 text-success text-center">
                <Check className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Check your email!</p>
                <p className="text-sm mt-1">
                  Please confirm your subscription.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-error/10 text-error text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-error">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    {...register('name')}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notifyNewPosts"
                      checked={notifyNewPosts}
                      onCheckedChange={(checked) =>
                        setValue('notifyNewPosts', checked as boolean)
                      }
                    />
                    <Label htmlFor="notifyNewPosts" className="text-sm font-normal">
                      Notify me of new posts
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notifyNewsletter"
                      checked={notifyNewsletter}
                      onCheckedChange={(checked) =>
                        setValue('notifyNewsletter', checked as boolean)
                      }
                    />
                    <Label htmlFor="notifyNewsletter" className="text-sm font-normal">
                      Subscribe to newsletter
                    </Label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* RSS Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rss className="h-5 w-5 text-accent" />
              <CardTitle>RSS Feed</CardTitle>
            </div>
            <CardDescription>
              Subscribe using your favorite RSS reader.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground-muted">
              Use an RSS reader to stay up-to-date with new posts without
              giving your email address.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/feed.xml">
                <Rss className="h-4 w-4 mr-2" />
                Get RSS Feed
              </Link>
            </Button>
            <p className="text-xs text-foreground-muted text-center">
              Copy and paste this URL into your RSS reader:
            </p>
            <code className="block p-2 bg-background-subtle rounded text-xs break-all">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/feed.xml`
                : '/feed.xml'}
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
