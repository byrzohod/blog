import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    spamWord: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

import { checkSpam, sanitizeContent, getBlockedWords } from '@/lib/spam-filter';

describe('Spam Filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSpam', () => {
    it('should not flag clean content', async () => {
      const result = await checkSpam({
        content: 'This is a great article! Thanks for sharing.',
      });

      expect(result.isSpam).toBe(false);
      expect(result.score).toBeLessThan(50);
    });

    it('should flag content with blocked words', async () => {
      // Use content with multiple spam indicators to exceed threshold (50)
      const result = await checkSpam({
        content: 'Buy viagra now! Click here for cialis at https://spam.com and https://spam2.com and https://spam3.com and https://spam4.com',
      });

      expect(result.isSpam).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should flag content with too many URLs', async () => {
      const result = await checkSpam({
        content: 'Check out https://spam1.com and https://spam2.com and https://spam3.com and https://spam4.com',
      });

      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons).toContain('Too many URLs');
    });

    it('should flag content with high URL ratio', async () => {
      const result = await checkSpam({
        content: 'Visit https://spam.com now',
      });

      expect(result.reasons).toContain('High URL to text ratio');
    });

    it('should flag content with suspicious URL patterns', async () => {
      const result = await checkSpam({
        content: 'Click here: bit.ly/spam123',
      });

      expect(result.reasons).toContain('Contains suspicious URL pattern');
    });

    it('should flag excessive capitalization', async () => {
      const result = await checkSpam({
        content: 'THIS IS ALL CAPS AND IT LOOKS LIKE SPAM!!!',
      });

      expect(result.reasons).toContain('Excessive capitalization');
    });

    it('should flag repeated characters', async () => {
      const result = await checkSpam({
        content: 'Amazinggggggg offer!!!!!!',
      });

      expect(result.reasons).toContain('Repeated characters detected');
    });

    it('should flag suspicious email domains', async () => {
      const result = await checkSpam({
        content: 'Hello world',
        authorEmail: 'spammer@tempmail.com',
      });

      expect(result.reasons).toContain('Suspicious email domain');
    });

    it('should flag very short content with URL', async () => {
      const result = await checkSpam({
        content: 'Click https://spam.com',
      });

      expect(result.reasons).toContain('Very short content with URL');
    });

    it('should flag potential script injection', async () => {
      const result = await checkSpam({
        content: '<script>alert("xss")</script>',
      });

      expect(result.isSpam).toBe(true);
      expect(result.reasons).toContain('Potential script injection');
    });

    it('should flag javascript: in content', async () => {
      const result = await checkSpam({
        content: 'Click javascript:void(0)',
      });

      expect(result.reasons).toContain('Potential script injection');
    });

    it('should flag onclick attributes', async () => {
      const result = await checkSpam({
        content: '<img onclick="evil()" src="x">',
      });

      expect(result.reasons).toContain('Potential script injection');
    });

    it('should flag excessively long content', async () => {
      const result = await checkSpam({
        content: 'a'.repeat(15000),
      });

      expect(result.reasons).toContain('Excessively long content');
    });

    it('should calculate cumulative score', async () => {
      const result = await checkSpam({
        content: 'BUY VIAGRA NOW!!!! CLICK HERE https://bit.ly/spam',
      });

      expect(result.isSpam).toBe(true);
      expect(result.score).toBeGreaterThan(50);
      expect(result.reasons.length).toBeGreaterThan(2);
    });
  });

  describe('sanitizeContent', () => {
    it('should remove script tags', () => {
      const content = 'Hello <script>alert("xss")</script> world';
      expect(sanitizeContent(content)).toBe('Hello  world');
    });

    it('should remove javascript: protocol', () => {
      const content = 'Click javascript:alert(1)';
      expect(sanitizeContent(content)).toBe('Click alert(1)');
    });

    it('should remove onclick handlers', () => {
      const content = '<img onclick="evil()" src="x">';
      expect(sanitizeContent(content)).toBe('<img src="x">');
    });

    it('should remove onerror handlers', () => {
      const content = '<img onerror="evil()" src="x">';
      expect(sanitizeContent(content)).toBe('<img src="x">');
    });

    it('should remove iframe tags', () => {
      const content = 'Content <iframe src="evil"></iframe> more';
      expect(sanitizeContent(content)).toBe('Content  more');
    });

    it('should remove object tags', () => {
      const content = 'Content <object data="evil"></object> more';
      expect(sanitizeContent(content)).toBe('Content  more');
    });

    it('should remove embed tags', () => {
      const content = 'Content <embed src="evil"> more';
      expect(sanitizeContent(content)).toBe('Content  more');
    });

    it('should preserve safe content', () => {
      const content = 'This is a safe <b>comment</b> with <a href="https://safe.com">links</a>';
      expect(sanitizeContent(content)).toBe(content);
    });
  });

  describe('getBlockedWords', () => {
    it('should return default blocked words', async () => {
      const words = await getBlockedWords();

      expect(words).toContain('viagra');
      expect(words).toContain('casino');
      expect(words).toContain('lottery');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content', async () => {
      const result = await checkSpam({ content: '' });

      expect(result.isSpam).toBe(false);
    });

    it('should handle content with only whitespace', async () => {
      const result = await checkSpam({ content: '   \n\t  ' });

      expect(result.isSpam).toBe(false);
    });

    it('should handle content with emojis', async () => {
      const result = await checkSpam({
        content: 'Great post! Love it! Amazing work ',
      });

      expect(result.isSpam).toBe(false);
    });

    it('should not flag legitimate long comments', async () => {
      const result = await checkSpam({
        content: `
          This is a thoughtful and detailed comment about the article.
          I really appreciate the depth of research that went into this piece.
          The examples you provided were particularly helpful in understanding
          the concepts being discussed. I especially liked the section about
          best practices. Looking forward to reading more of your content!
        `,
      });

      expect(result.isSpam).toBe(false);
    });

    it('should handle mixed case blocked words', async () => {
      const result = await checkSpam({
        content: 'Get VIAGRA and CaSiNo bonuses!',
      });

      expect(result.isSpam).toBe(true);
    });
  });
});
