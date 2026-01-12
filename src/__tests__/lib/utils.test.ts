import { describe, it, expect } from 'vitest';
import { cn, generateSlug, calculateReadingTime, formatDate, truncate } from '@/lib/utils';

describe('cn (classNames utility)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle undefined', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});

describe('generateSlug', () => {
  it('should convert text to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world');
  });

  it('should handle multiple spaces', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world');
  });

  it('should trim whitespace', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });

  it('should handle numbers', () => {
    expect(generateSlug('Post 123')).toBe('post-123');
  });
});

describe('calculateReadingTime', () => {
  it('should return 1 for very short content', () => {
    expect(calculateReadingTime('Hello world')).toBe(1);
  });

  it('should calculate correctly for longer content', () => {
    const words = Array(400).fill('word').join(' ');
    expect(calculateReadingTime(words)).toBe(2);
  });

  it('should handle HTML content', () => {
    const html = '<p>' + Array(200).fill('word').join(' ') + '</p>';
    expect(calculateReadingTime(html)).toBe(1);
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });
});

describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('should truncate long strings', () => {
    expect(truncate('Hello World', 8)).toBe('Hello Wo...');
  });

  it('should handle exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});
