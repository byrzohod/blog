import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave, formatLastSaved } from '@/hooks/use-autosave';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator.sendBeacon
const mockSendBeacon = vi.fn();
Object.defineProperty(navigator, 'sendBeacon', {
  value: mockSendBeacon,
  writable: true,
});

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    mockSendBeacon.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with idle status', () => {
    const { result } = renderHook(() =>
      useAutosave({
        postId: 'test-id',
        data: { title: 'Test' },
        enabled: true,
        debounceMs: 1000,
      })
    );

    expect(result.current.status).toBe('idle');
    expect(result.current.lastSavedAt).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should not save when disabled', async () => {
    const { result } = renderHook(() =>
      useAutosave({
        postId: 'test-id',
        data: { title: 'Test' },
        enabled: false,
        debounceMs: 1000,
      })
    );

    // Fast-forward timers
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('should not save when postId is null', async () => {
    const { result } = renderHook(() =>
      useAutosave({
        postId: null,
        data: { title: 'Test' },
        enabled: true,
        debounceMs: 1000,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('should call save after debounce period', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, lastSavedAt: new Date().toISOString() }),
    });

    const { result, rerender } = renderHook(
      ({ data }) =>
        useAutosave({
          postId: 'test-id',
          data,
          enabled: true,
          debounceMs: 1000,
        }),
      { initialProps: { data: { title: 'Initial' } } }
    );

    // Change data to trigger save
    rerender({ data: { title: 'Changed' } });

    // Before debounce
    expect(mockFetch).not.toHaveBeenCalled();

    // After debounce
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/posts/test-id/autosave',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should update status to saved on success', async () => {
    const lastSavedAt = new Date().toISOString();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, lastSavedAt }),
    });

    const { result } = renderHook(() =>
      useAutosave({
        postId: 'test-id',
        data: { title: 'Test' },
        enabled: true,
        debounceMs: 10000,
      })
    );

    // Manually trigger save and wait for it to complete
    await act(async () => {
      await result.current.save();
    });

    expect(result.current.status).toBe('saved');
    expect(result.current.lastSavedAt).toBe(lastSavedAt);
  });

  it('should update status to error on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Save failed' }),
    });

    const { result, rerender } = renderHook(
      ({ data }) =>
        useAutosave({
          postId: 'test-id',
          data,
          enabled: true,
          debounceMs: 100,
        }),
      { initialProps: { data: { title: 'Initial' } } }
    );

    rerender({ data: { title: 'Changed' } });

    // Advance timers and flush promises
    await act(async () => {
      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Save failed');
  });

  it('should provide manual save function', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, lastSavedAt: new Date().toISOString() }),
    });

    const { result } = renderHook(() =>
      useAutosave({
        postId: 'test-id',
        data: { title: 'Test' },
        enabled: true,
        debounceMs: 10000, // Long debounce
      })
    );

    // Manually trigger save
    await act(async () => {
      await result.current.save();
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('should call onSaveSuccess callback', async () => {
    const lastSavedAt = new Date().toISOString();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, lastSavedAt }),
    });

    const onSaveSuccess = vi.fn();

    const { result } = renderHook(() =>
      useAutosave({
        postId: 'test-id',
        data: { title: 'Test' },
        enabled: true,
        debounceMs: 100,
        onSaveSuccess,
      })
    );

    await act(async () => {
      await result.current.save();
    });

    expect(onSaveSuccess).toHaveBeenCalledWith(lastSavedAt);
  });

  it('should call onSaveError callback', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Network error' }),
    });

    const onSaveError = vi.fn();

    const { result } = renderHook(() =>
      useAutosave({
        postId: 'test-id',
        data: { title: 'Test' },
        enabled: true,
        debounceMs: 100,
        onSaveError,
      })
    );

    await act(async () => {
      await result.current.save();
    });

    expect(onSaveError).toHaveBeenCalledWith('Network error');
  });
});

describe('formatLastSaved', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty string for null', () => {
    expect(formatLastSaved(null)).toBe('');
  });

  it('should return "just now" for recent saves', () => {
    const recentTime = new Date('2024-01-15T11:59:30Z').toISOString();
    expect(formatLastSaved(recentTime)).toBe('just now');
  });

  it('should return minutes ago for saves within an hour', () => {
    const fiveMinutesAgo = new Date('2024-01-15T11:55:00Z').toISOString();
    expect(formatLastSaved(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('should return singular minute', () => {
    const oneMinuteAgo = new Date('2024-01-15T11:59:00Z').toISOString();
    expect(formatLastSaved(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('should return time for older saves', () => {
    const twoHoursAgo = new Date('2024-01-15T10:00:00Z').toISOString();
    const result = formatLastSaved(twoHoursAgo);
    // Should contain time format like "10:00 AM"
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});
