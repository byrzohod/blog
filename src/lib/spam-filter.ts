import { prisma } from '@/lib/db';

export interface SpamCheckResult {
  isSpam: boolean;
  score: number;
  reasons: string[];
}

interface SpamCheckOptions {
  content: string;
  authorEmail?: string;
  authorId?: string;
  ipAddress?: string;
}

// Default blocked words (can be extended via database)
const DEFAULT_BLOCKED_WORDS = [
  'viagra',
  'cialis',
  'casino',
  'poker',
  'lottery',
  'winner',
  'prize',
  'free money',
  'click here',
  'buy now',
  'act now',
  'limited time',
  'earn money',
  'work from home',
  'make money fast',
  'nigerian prince',
  'inheritance',
  'cryptocurrency scheme',
  'binary options',
];

// URL patterns that are often spam
const SUSPICIOUS_URL_PATTERNS = [
  /bit\.ly/i,
  /tinyurl/i,
  /\.(ru|cn|tk|ml|ga|cf)\/\S+/i, // Suspicious TLDs with paths
];

/**
 * Check if content is spam using rule-based detection
 */
export async function checkSpam(options: SpamCheckOptions): Promise<SpamCheckResult> {
  const { content, authorEmail, authorId } = options;
  const reasons: string[] = [];
  let score = 0;

  // Normalize content for checking
  const normalizedContent = content.toLowerCase();

  // 1. Check for blocked words from database
  const dbBlockedWords = await getBlockedWordsFromDb();
  const allBlockedWords = [...DEFAULT_BLOCKED_WORDS, ...dbBlockedWords];

  for (const word of allBlockedWords) {
    if (normalizedContent.includes(word.toLowerCase())) {
      score += 30;
      reasons.push(`Contains blocked word: "${word}"`);
    }
  }

  // 2. Check URL density (too many URLs is suspicious)
  const urlMatches = content.match(/https?:\/\/[^\s]+/gi) || [];
  const urlCount = urlMatches.length;
  const wordCount = content.split(/\s+/).length;

  if (urlCount > 3) {
    score += 20;
    reasons.push('Too many URLs');
  }

  if (wordCount > 0 && urlCount / wordCount > 0.3) {
    score += 25;
    reasons.push('High URL to text ratio');
  }

  // 3. Check for suspicious URL patterns
  for (const pattern of SUSPICIOUS_URL_PATTERNS) {
    if (pattern.test(content)) {
      score += 15;
      reasons.push('Contains suspicious URL pattern');
      break;
    }
  }

  // 4. Check for excessive capitalization (shouting)
  const uppercaseRatio = (content.match(/[A-Z]/g)?.length || 0) / content.length;
  if (uppercaseRatio > 0.5 && content.length > 20) {
    score += 15;
    reasons.push('Excessive capitalization');
  }

  // 5. Check for repeated characters (like "freeeeee" or "!!!!!!")
  if (/(.)\1{4,}/i.test(content)) {
    score += 10;
    reasons.push('Repeated characters detected');
  }

  // 6. Check for suspicious email patterns
  if (authorEmail) {
    const emailDomain = authorEmail.split('@')[1]?.toLowerCase();
    const suspiciousDomains = ['tempmail', 'throwaway', 'guerrilla', 'mailinator', '10minute'];

    if (suspiciousDomains.some(domain => emailDomain?.includes(domain))) {
      score += 25;
      reasons.push('Suspicious email domain');
    }
  }

  // 7. Check for very short content with URLs (often spam)
  if (wordCount < 5 && urlCount > 0) {
    score += 20;
    reasons.push('Very short content with URL');
  }

  // 8. Check for duplicate comments from same user (rate limiting)
  if (authorId) {
    const recentComments = await prisma.comment.count({
      where: {
        authorId,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentComments >= 5) {
      score += 30;
      reasons.push('Too many comments in short time');
    }
  }

  // 9. Check for content that looks like HTML/script injection
  if (/<script|javascript:|onclick|onerror/i.test(content)) {
    score += 50;
    reasons.push('Potential script injection');
  }

  // 10. Check content length extremes
  if (content.length > 10000) {
    score += 15;
    reasons.push('Excessively long content');
  }

  // Determine if it's spam (threshold: 50)
  const isSpam = score >= 50;

  return {
    isSpam,
    score,
    reasons,
  };
}

/**
 * Get blocked words from database
 */
async function getBlockedWordsFromDb(): Promise<string[]> {
  try {
    const words = await prisma.spamWord.findMany({
      select: { word: true },
    });
    return words.map(w => w.word);
  } catch {
    // Table might not exist yet
    return [];
  }
}

/**
 * Add a word to the spam blocklist
 */
export async function addBlockedWord(word: string): Promise<boolean> {
  try {
    await prisma.spamWord.create({
      data: { word: word.toLowerCase() },
    });
    return true;
  } catch {
    return false; // Word might already exist
  }
}

/**
 * Remove a word from the spam blocklist
 */
export async function removeBlockedWord(word: string): Promise<boolean> {
  try {
    await prisma.spamWord.delete({
      where: { word: word.toLowerCase() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all blocked words
 */
export async function getBlockedWords(): Promise<string[]> {
  const dbWords = await getBlockedWordsFromDb();
  return [...new Set([...DEFAULT_BLOCKED_WORDS, ...dbWords])];
}

/**
 * Simple content sanitization (remove potential XSS)
 */
export function sanitizeContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '');
}
