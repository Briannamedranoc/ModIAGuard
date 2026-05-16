export type AIRecommendation = 'remove' | 'approve' | 'needs_context' | 'spam';

export type RecommendInput = {
  toxicity: number;
  spam: number;
};

export function recommendAction({ toxicity, spam }: RecommendInput): AIRecommendation {
  if (toxicity > 0.6 || spam > 0.6) {
    return 'remove';
  }
  if (spam > 0.4) {
    return 'spam';
  }
  if (toxicity > 0.3) {
    return 'needs_context';
  }
  return 'approve';
}
