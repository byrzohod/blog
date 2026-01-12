'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveOptions {
  postId: string | null;
  data: Record<string, unknown>;
  enabled?: boolean;
  debounceMs?: number;
  onSaveSuccess?: (lastSavedAt: string) => void;
  onSaveError?: (error: string) => void;
}

interface AutosaveResult {
  status: AutosaveStatus;
  lastSavedAt: string | null;
  error: string | null;
  save: () => Promise<void>;
}

export function useAutosave({
  postId,
  data,
  enabled = true,
  debounceMs = 30000, // 30 seconds default
  onSaveSuccess,
  onSaveError,
}: AutosaveOptions): AutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previousDataRef = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const save = useCallback(async () => {
    if (!postId || !enabled) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setStatus('saving');
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/autosave`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      const result = await response.json();
      setStatus('saved');
      setLastSavedAt(result.lastSavedAt);
      onSaveSuccess?.(result.lastSavedAt);

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 3000);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to save';
      setStatus('error');
      setError(errorMessage);
      onSaveError?.(errorMessage);
    }
  }, [postId, data, enabled, onSaveSuccess, onSaveError]);

  // Debounced auto-save when data changes
  useEffect(() => {
    if (!postId || !enabled) return;

    const currentData = JSON.stringify(data);

    // Skip if data hasn't changed
    if (currentData === previousDataRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      previousDataRef.current = currentData;
      save();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [postId, data, enabled, debounceMs, save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Save before page unload
  useEffect(() => {
    if (!postId || !enabled) return;

    const handleBeforeUnload = () => {
      const currentData = JSON.stringify(data);
      if (currentData !== previousDataRef.current) {
        // Use sendBeacon for reliable save on unload
        navigator.sendBeacon(
          `/api/posts/${postId}/autosave`,
          JSON.stringify(data)
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [postId, data, enabled]);

  return {
    status,
    lastSavedAt,
    error,
    save,
  };
}

// Helper function to format last saved time
export function formatLastSaved(isoString: string | null): string {
  if (!isoString) return '';

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
