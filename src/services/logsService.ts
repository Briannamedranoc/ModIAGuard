import { kv } from '../utils/kv';

const LEGACY_LOG_KEY = 'modaiguard:logs';
const GLOBAL_LOG_KEY = 'AI_LOGS';

export type AIRecommendation = 'remove' | 'approve' | 'needs_context' | 'spam';

export type LogEntryInput = {
  moderator: string;
  action: string;
  thingId: string;
  subreddit: string;
  source: string;
  toxicityScore?: number | null;
  spamScore?: number | null;
  aiRecommendation?: AIRecommendation | null;
  autoResponse?: string | null;
  auto?: boolean;
};

export type LogEntry = LogEntryInput & {
  id: string;
  ts: number;
  timestamp: number;
};

function normalizeSubreddit(subreddit: string): string {
  return subreddit.trim().replace(/^r\//i, '');
}

function logKey(subreddit: string): string {
  const name = normalizeSubreddit(subreddit);
  return name ? `AI_LOGS_${name}` : GLOBAL_LOG_KEY;
}

function buildLogPayload(entry: LogEntryInput): LogEntryInput {
  const payload: LogEntryInput = {
    moderator: entry.moderator,
    action: entry.action,
    thingId: entry.thingId,
    subreddit: normalizeSubreddit(entry.subreddit),
    source: entry.source,
  };

  if (entry.toxicityScore != null && Number.isFinite(entry.toxicityScore)) {
    payload.toxicityScore = clamp01(entry.toxicityScore);
  }
  if (entry.spamScore != null && Number.isFinite(entry.spamScore)) {
    payload.spamScore = clamp01(entry.spamScore);
  }
  if (entry.aiRecommendation != null) {
    payload.aiRecommendation = entry.aiRecommendation;
  }
  if (entry.autoResponse != null && entry.autoResponse.trim()) {
    payload.autoResponse = entry.autoResponse.trim();
  }
  if (entry.auto === true) {
    payload.auto = true;
  }

  return payload;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function parseLogEntry(item: string): LogEntry | null {
  try {
    const parsed = JSON.parse(item) as LogEntry;
    if (!parsed.id || !parsed.thingId) {
      return null;
    }
    const ts = parsed.ts ?? parsed.timestamp ?? Date.now();
    return { ...parsed, ts, timestamp: ts };
  } catch {
    return null;
  }
}

async function readLogsFromKeys(keys: string[], limit: number): Promise<LogEntry[]> {
  const seen = new Set<string>();
  const merged: LogEntry[] = [];

  for (const key of keys) {
    const raw = await kv.lrange(key, 0, limit - 1);
    for (const item of raw) {
      const log = parseLogEntry(item);
      if (!log || seen.has(log.id)) {
        continue;
      }
      seen.add(log.id);
      merged.push(log);
    }
  }

  return merged.sort((a, b) => b.ts - a.ts).slice(0, limit);
}

export async function addLogEntry(entry: LogEntryInput): Promise<LogEntry> {
  const id = crypto.randomUUID();
  const ts = Date.now();
  const log: LogEntry = {
    id,
    ts,
    timestamp: ts,
    ...buildLogPayload(entry),
  };

  const serialized = JSON.stringify(log);
  const subredditKey = logKey(entry.subreddit);

  await kv.lpush(subredditKey, serialized);
  await kv.lpush(GLOBAL_LOG_KEY, serialized);

  return log;
}

export async function getLogs(subreddit: string, limit = 100): Promise<LogEntry[]> {
  const name = normalizeSubreddit(subreddit);
  const keys = [logKey(name), GLOBAL_LOG_KEY, LEGACY_LOG_KEY];
  return readLogsFromKeys(keys, limit);
}

export async function getLogsByThingId(thingId: string, subreddit?: string): Promise<LogEntry[]> {
  const normalizedId = thingId.trim();
  if (!normalizedId) {
    return [];
  }

  const logs = subreddit
    ? await getLogs(subreddit, 500)
    : await readLogsFromKeys([GLOBAL_LOG_KEY, LEGACY_LOG_KEY], 500);

  return logs.filter((log) => log.thingId === normalizedId);
}
