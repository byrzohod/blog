'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ArrowLeft, Loader2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setTokenError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError('root', { message: result.error || 'Something went wrong' });
        return;
      }

      setIsSuccess(true);
    } catch {
      setError('root', { message: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-error" />
          </div>
          <CardTitle>Invalid Reset Link</CardTitle>
          <CardDescription>
            {tokenError}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/forgot-password">
              Request New Reset Link
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-6 w-6 text-success" />
          </div>
          <CardTitle>Password Reset Complete</CardTitle>
          <CardDescription>
            Your password has been successfully reset. You can now log in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">
              Go to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-accent" />
        </div>
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errors.root && (
            <div className="p-3 rounded-md bg-error/10 text-error text-sm">
              {errors.root.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-error">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-error">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
          <Link href="/login" className="text-sm text-accent hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1 inline" />
            Back to Login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

function ResetPasswordFormFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-accent" />
        </div>
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-background-muted rounded animate-pulse" />
          <div className="h-10 bg-background-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-background-muted rounded animate-pulse" />
          <div className="h-10 bg-background-muted rounded animate-pulse" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-10 w-full bg-background-muted rounded animate-pulse" />
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Suspense fallback={<ResetPasswordFormFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
