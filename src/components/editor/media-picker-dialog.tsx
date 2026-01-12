'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Search, Check, ImageIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Media {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: MediaPickerDialogProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        type: 'image',
      });
      if (search) {
        params.set('search', search);
      }

      const response = await fetch(`/api/upload?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open, fetchMedia]);

  const handleSelect = () => {
    const selected = media.find((m) => m.id === selectedId);
    if (selected) {
      onSelect(selected.url);
      onOpenChange(false);
      setSelectedId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Image from Media Library</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-foreground-muted">
              <ImageIcon className="h-12 w-12 mb-2" />
              <p>No images found</p>
              <p className="text-sm">Upload images via the Media page</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 p-1">
              {media.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                    selectedId === item.id
                      ? 'border-accent ring-2 ring-accent ring-offset-2'
                      : 'border-transparent hover:border-accent/50'
                  )}
                >
                  <Image
                    src={item.thumbnailUrl || item.url}
                    alt={item.altText || item.filename}
                    fill
                    className="object-cover"
                  />
                  {selectedId === item.id && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <div className="p-2 rounded-full bg-accent text-accent-foreground">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedId}>
            Select Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
