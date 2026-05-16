import { matchRules } from './autoResponderService';
import { addLogEntry, type AIRecommendation } from './logsService';
import { RedditAPI } from '../utils/redditApi';

export type ModActionType = 'approve' | 'remove' | 'spam' | 'ignore_reports';

export type ModActionMetadata = {
  toxicityScore?: number | null;
  spamScore?: number | null;
  aiRecommendation?: AIRecommendation | null;
  title?: string | null;
  body?: string | null;
};

export async function performModAction(
  subreddit: string,
  thingId: string,
  action: string,
  metadata: ModActionMetadata = {},
): Promise<{ action: ModActionType; thingId: string; subreddit: string }> {
  const reddit = new RedditAPI();
  const contentText = [metadata.title, metadata.body].filter(Boolean).join('\n').trim();
  const matchedRule = contentText ? await matchRules(subreddit, contentText) : null;

  switch (action) {
    case 'approve':
      await reddit.approve(thingId);
      break;
    case 'remove':
      await reddit.remove(thingId);
      break;
    case 'spam':
      await reddit.markSpam(thingId);
      break;
    case 'ignore_reports':
      await reddit.ignoreReports(thingId);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }

  await addLogEntry({
    moderator: 'human',
    action,
    thingId,
    subreddit,
    source: 'ReportReview',
    toxicityScore: metadata.toxicityScore ?? null,
    spamScore: metadata.spamScore ?? null,
    aiRecommendation: metadata.aiRecommendation ?? null,
    autoResponse: matchedRule?.response ?? null,
  });

  return {
    action: action as ModActionType,
    thingId,
    subreddit,
  };
}
