'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <AlertTriangle className="h-16 w-16 text-error mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
        <p className="text-foreground-muted text-lg mb-8 max-w-md mx-auto">
          An unexpected error occurred. We&apos;ve been notified and are working to fix it.
        </p>

        {error.digest && (
          <p className="text-sm text-foreground-subtle mb-6">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
