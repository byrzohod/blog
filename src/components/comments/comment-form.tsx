'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
});

type CommentForm = z.infer<typeof commentSchema>;

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = 'Write a comment...',
}: CommentFormProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
  });

  if (!session) {
    return (
      <div className="p-4 rounded-md bg-background-subtle text-center">
        <p className="text-foreground-muted mb-2">
          Sign in to leave a comment
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (data: CommentForm) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          parentId,
          content: data.content,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError('root', { message: result.error || 'Failed to post comment' });
        return;
      }

      reset();
      onSuccess?.();
    } catch {
      setError('root', { message: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || ''} />
          <AvatarFallback>
            {session.user?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={placeholder}
            rows={3}
            {...register('content')}
            className="resize-none"
          />
          {errors.content && (
            <p className="text-sm text-error mt-1">{errors.content.message}</p>
          )}
          {errors.root && (
            <p className="text-sm text-error mt-1">{errors.root.message}</p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
}
