import { recommendAction, type AIRecommendation } from './aiRecommendService';
import { matchRules } from './autoResponderService';
import { addLogEntry } from './logsService';
import { analyzeSpam } from './spamService';
import { analyzeToxicity } from './toxicityService';
import { RedditAPI } from '../utils/redditApi';

export type ItemAnalysis = {
  toxicityScore: number;
  spamScore: number;
  recommendation: AIRecommendation;
};

export type AutoModerationResult = {
  thingId: string;
  recommendation: AIRecommendation;
  actionTaken: string;
  toxicityScore: number;
  spamScore: number;
};

function recommendationToAction(recommendation: AIRecommendation): string {
  switch (recommendation) {
    case 'remove':
      return 'remove';
    case 'spam':
      return 'spam';
    case 'needs_context':
      return 'ignore_reports';
    case 'approve':
      return 'approve';
  }
}

export async function analyzeItem(text: string): Promise<ItemAnalysis> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      toxicityScore: 0,
      spamScore: 0,
      recommendation: 'approve',
    };
  }

  const [toxicity, spam] = await Promise.all([
    analyzeToxicity(trimmed),
    analyzeSpam(trimmed),
  ]);

  const recommendation = recommendAction({
    toxicity: toxicity.toxicityScore,
    spam: spam.spamScore,
  });

  return {
    toxicityScore: toxicity.toxicityScore,
    spamScore: spam.spamScore,
    recommendation,
  };
}

export async function autoModerateItem(params: {
  subreddit: string;
  thingId: string;
  text: string;
}): Promise<AutoModerationResult> {
  const analysis = await analyzeItem(params.text);
  const actionTaken = recommendationToAction(analysis.recommendation);
  const reddit = new RedditAPI();

  switch (analysis.recommendation) {
    case 'remove':
      await reddit.remove(params.thingId);
      break;
    case 'spam':
      await reddit.markSpam(params.thingId);
      break;
    case 'needs_context':
      await reddit.ignoreReports(params.thingId);
      break;
    case 'approve':
      await reddit.approve(params.thingId);
      break;
  }

  const matchedRule = params.text.trim()
    ? await matchRules(params.subreddit, params.text)
    : null;

  await addLogEntry({
    moderator: 'auto',
    action: actionTaken,
    thingId: params.thingId,
    subreddit: params.subreddit,
    source: 'AIEngine',
    toxicityScore: analysis.toxicityScore,
    spamScore: analysis.spamScore,
    aiRecommendation: analysis.recommendation,
    auto: true,
    autoResponse: matchedRule?.response ?? null,
  });

  return {
    thingId: params.thingId,
    recommendation: analysis.recommendation,
    actionTaken,
    toxicityScore: analysis.toxicityScore,
    spamScore: analysis.spamScore,
  };
}

export async function runAutoModeration(subreddit: string): Promise<AutoModerationResult[]> {
  const reddit = new RedditAPI();
  const queue = await reddit.getModQueue(subreddit);
  const results: AutoModerationResult[] = [];

  for (const item of queue) {
    const text = [item.title, item.body].filter(Boolean).join('\n').trim();
    if (!text) {
      continue;
    }

    const result = await autoModerateItem({
      subreddit,
      thingId: item.id,
      text,
    });
    results.push(result);
  }

  return results;
}
