import { getLogs, type AIRecommendation, type LogEntry } from './logsService';

export type ModerationAction = 'approve' | 'remove' | 'spam' | 'ignore_reports';

export type ModerationSource = 'ReportReview' | 'AutoResponder' | 'AIEngine';

export type ModerationEntry = {
  id: string;
  thingId: string;
  subreddit: string;
  moderator: string;
  action: ModerationAction;
  aiRecommendation?: AIRecommendation;
  toxicityScore?: number;
  spamScore?: number;
  autoResponse?: string;
  createdAt: number;
  source: ModerationSource;
  auto?: boolean;
};

const VALID_ACTIONS = new Set<ModerationAction>([
  'approve',
  'remove',
  'spam',
  'ignore_reports',
]);

function normalizeAction(action: string): ModerationAction | null {
  const key = action.trim() as ModerationAction;
  return VALID_ACTIONS.has(key) ? key : null;
}

function resolveSource(log: LogEntry): ModerationSource {
  const raw = (log.source || '').trim().toLowerCase();

  if (raw.includes('autoresponder') || raw === 'auto-responder') {
    return 'AutoResponder';
  }
  if (raw.includes('aiengine') || raw === 'ai' || raw === 'ai-engine') {
    return 'AIEngine';
  }
  if (log.autoResponse && (raw.includes('auto') || log.moderator.toLowerCase() === 'auto')) {
    return 'AutoResponder';
  }
  return 'ReportReview';
}

function logToModeration(log: LogEntry): ModerationEntry | null {
  const action = normalizeAction(log.action);
  if (!action) {
    return null;
  }

  const createdAt = log.ts ?? log.timestamp ?? Date.now();
  const entry: ModerationEntry = {
    id: log.id,
    thingId: log.thingId,
    subreddit: log.subreddit,
    moderator: log.moderator,
    action,
    createdAt,
    source: resolveSource(log),
  };

  if (log.aiRecommendation != null) {
    entry.aiRecommendation = log.aiRecommendation;
  }
  if (log.toxicityScore != null && Number.isFinite(log.toxicityScore)) {
    entry.toxicityScore = log.toxicityScore;
  }
  if (log.spamScore != null && Number.isFinite(log.spamScore)) {
    entry.spamScore = log.spamScore;
  }
  if (log.autoResponse?.trim()) {
    entry.autoResponse = log.autoResponse.trim();
  }
  if (log.auto === true) {
    entry.auto = true;
  }

  return entry;
}

export async function getModerations(
  subreddit: string,
  limit = 500,
): Promise<ModerationEntry[]> {
  const logs = await getLogs(subreddit, limit);
  const moderations: ModerationEntry[] = [];

  for (const log of logs) {
    const entry = logToModeration(log);
    if (entry) {
      moderations.push(entry);
    }
  }

  return moderations.sort((a, b) => b.createdAt - a.createdAt);
}
