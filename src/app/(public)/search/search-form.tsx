'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from 'use-debounce';

interface SearchFormProps {
  initialQuery: string;
}

export function SearchForm({ initialQuery }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (value.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(value)}`);
    } else if (value.length === 0) {
      router.push('/search');
    }
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    router.push('/search');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-muted" />
        <Input
          type="text"
          placeholder="Search posts..."
          value={query}
          onChange={handleChange}
          className="pl-10 pr-10 h-12 text-lg"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="text-sm text-foreground-muted mt-2">
        Enter at least 2 characters to search
      </p>
    </form>
  );
}
