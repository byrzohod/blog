'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const registered = searchParams.get('registered');
  const verified = searchParams.get('verified');
  const message = searchParams.get('message');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError('root', { message: result.error });
      setIsLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {registered && (
            <div className="p-3 rounded-md bg-success/10 text-success text-sm">
              Account created successfully! Please check your email to verify your account.
            </div>
          )}

          {verified && (
            <div className="p-3 rounded-md bg-success/10 text-success text-sm">
              Email verified successfully! You can now sign in.
            </div>
          )}

          {message === 'already_verified' && (
            <div className="p-3 rounded-md bg-accent/10 text-accent text-sm">
              Your email is already verified. Please sign in.
            </div>
          )}

          {(error || errors.root) && (
            <div className="p-3 rounded-md bg-error/10 text-error text-sm">
              {error === 'unauthorized'
                ? 'You do not have permission to access this page.'
                : error === 'invalid_token'
                ? 'Invalid verification link. Please request a new one.'
                : error === 'expired_token'
                ? 'Verification link has expired. Please request a new one.'
                : error === 'missing_token'
                ? 'Missing verification token.'
                : error === 'verification_failed'
                ? 'Verification failed. Please try again.'
                : errors.root?.message || 'An error occurred. Please try again.'}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-error">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-accent hover:text-accent-hover"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-error">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
          <div className="text-sm text-center space-y-2">
            <p className="text-foreground-muted">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-accent hover:text-accent-hover underline">
                Sign up
              </Link>
            </p>
            {(error === 'expired_token' || error === 'invalid_token') && (
              <p className="text-foreground-muted">
                <Link href="/resend-verification" className="text-accent hover:text-accent-hover underline">
                  Resend verification email
                </Link>
              </p>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

function LoginFormFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-12 bg-background-muted rounded animate-pulse" />
          <div className="h-10 bg-background-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-background-muted rounded animate-pulse" />
          <div className="h-10 bg-background-muted rounded animate-pulse" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-10 w-full bg-background-muted rounded animate-pulse" />
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
