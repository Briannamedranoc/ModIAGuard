import { extractUrls } from '../utils';

const SPAM_KEYWORDS = ['free', 'visit my site', 'promo', 'cheap', 'buy now'] as const;

const LINK_SCORE = 0.2;
const REPETITION_SCORE = 0.3;
const KEYWORD_SCORE = 0.5;
const MAX_SCORE = 1;

export type SpamAnalysis = {
  spamScore: number;
  reasons: string[];
  linksFound: string[];
};

function detectSpamKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

function hasRepeatedText(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 8) {
    return false;
  }

  const lines = normalized.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 2 && new Set(lines).size < lines.length) {
    return true;
  }

  const minPhraseLength = 10;
  const maxPhraseLength = Math.min(40, Math.floor(normalized.length / 2));
  for (let len = maxPhraseLength; len >= minPhraseLength; len--) {
    for (let i = 0; i <= normalized.length - len * 2; i++) {
      const phrase = normalized.slice(i, i + len).trim();
      if (phrase.length < minPhraseLength) {
        continue;
      }
      if (normalized.indexOf(phrase, i + len) !== -1) {
        return true;
      }
    }
  }

  const words = normalized.match(/\b\w{4,}\b/g) ?? [];
  const counts = new Map<string, number>();
  for (const word of words) {
    const next = (counts.get(word) ?? 0) + 1;
    counts.set(word, next);
    if (next >= 4) {
      return true;
    }
  }

  return false;
}

export async function analyzeSpam(text: string): Promise<SpamAnalysis> {
  const reasons: string[] = [];
  let score = 0;

  const linksFound = [...new Set(extractUrls(text))];
  if (linksFound.length > 0) {
    score += linksFound.length * LINK_SCORE;
    reasons.push(
      linksFound.length === 1
        ? 'Found 1 link in text'
        : `Found ${linksFound.length} links in text`,
    );
  }

  if (hasRepeatedText(text)) {
    score += REPETITION_SCORE;
    reasons.push('Repeated text detected');
  }

  const matchedKeywords = detectSpamKeywords(text);
  if (matchedKeywords.length > 0) {
    score += KEYWORD_SCORE;
    reasons.push(`Spam keywords detected: ${matchedKeywords.join(', ')}`);
  }

  const spamScore = Math.min(MAX_SCORE, score);

  return {
    spamScore,
    reasons,
    linksFound,
  };
}
