export type AIRecommendation = 'remove' | 'approve' | 'needs_context' | 'spam';

export type ReportAiAnalysis = {
  toxicityScore: number | null;
  spamScore: number | null;
  aiRecommendation: AIRecommendation | null;
  loading: boolean;
};
