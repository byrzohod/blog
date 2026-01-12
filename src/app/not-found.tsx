import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-accent/20">404</h1>
        <h2 className="text-3xl font-bold mt-4 mb-2">Page Not Found</h2>
        <p className="text-foreground-muted text-lg mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              View Blog
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
