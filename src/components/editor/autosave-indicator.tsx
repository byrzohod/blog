'use client';

import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';
import { AutosaveStatus, formatLastSaved } from '@/hooks/use-autosave';
import { cn } from '@/lib/utils';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: string | null;
  error: string | null;
  className?: string;
}

export function AutosaveIndicator({
  status,
  lastSavedAt,
  error,
  className,
}: AutosaveIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm',
        className
      )}
    >
      {status === 'idle' && lastSavedAt && (
        <>
          <Cloud className="h-4 w-4 text-foreground-muted" />
          <span className="text-foreground-muted">
            Saved {formatLastSaved(lastSavedAt)}
          </span>
        </>
      )}

      {status === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 text-accent animate-spin" />
          <span className="text-foreground-muted">Saving...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <Check className="h-4 w-4 text-success" />
          <span className="text-success">Saved</span>
        </>
      )}

      {status === 'error' && (
        <>
          <CloudOff className="h-4 w-4 text-error" />
          <span className="text-error" title={error || undefined}>
            Save failed
          </span>
        </>
      )}

      {status === 'idle' && !lastSavedAt && (
        <>
          <Cloud className="h-4 w-4 text-foreground-muted" />
          <span className="text-foreground-muted">Auto-save enabled</span>
        </>
      )}
    </div>
  );
}
