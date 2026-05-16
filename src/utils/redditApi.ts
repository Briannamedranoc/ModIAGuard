import { reddit } from '@devvit/web/server';
import type { Comment, Post } from '@devvit/reddit';
import type { T1, T3 } from '@devvit/shared-types/tid.js';

const MOD_QUEUE_LIMIT = 25;

export type ReportTuple = [string, string];

export type ModQueueItem = {
  id: string;
  author: string;
  kind: 't3' | 't1';
  title: string | null;
  body: string | null;
  permalink: string;
  mod_reports: ReportTuple[];
  user_reports: ReportTuple[];
  created_utc: number;
};

function normalizeSubredditName(subreddit: string): string {
  return subreddit.trim().replace(/^r\//i, '');
}

function normalizeThingId(thingId: string): T1 | T3 {
  const trimmed = thingId.trim();
  if (trimmed.startsWith('t3_')) {
    return trimmed as T3;
  }
  if (trimmed.startsWith('t1_')) {
    return trimmed as T1;
  }
  throw new Error(`Invalid thing id: ${thingId}`);
}

function toReportTuples(reasons: string[], source: 'mod' | 'user'): ReportTuple[] {
  return reasons.map((reason) => [reason, source]);
}

function isPost(thing: Post | Comment): thing is Post {
  return 'title' in thing;
}

function mapModQueueItem(thing: Post | Comment): ModQueueItem {
  const mod_reports = toReportTuples([...thing.modReportReasons], 'mod');
  const user_reports = toReportTuples([...thing.userReportReasons], 'user');

  if (isPost(thing)) {
    return {
      id: thing.id,
      author: thing.authorName,
      kind: 't3',
      title: thing.title,
      body: thing.body || null,
      permalink: thing.permalink,
      mod_reports,
      user_reports,
      created_utc: Math.floor(thing.createdAt.getTime() / 1000),
    };
  }

  return {
    id: thing.id,
    author: thing.authorName,
    kind: 't1',
    title: null,
    body: thing.body || null,
    permalink: thing.permalink,
    mod_reports,
    user_reports,
    created_utc: Math.floor(thing.createdAt.getTime() / 1000),
  };
}

export class RedditAPI {
  async getModQueue(subreddit: string): Promise<ModQueueItem[]> {
    const subredditName = normalizeSubredditName(subreddit);
    if (!subredditName) {
      return [];
    }

    const sub = await reddit.getSubredditByName(subredditName);
    const listing = sub.getModQueue({ type: 'all', limit: MOD_QUEUE_LIMIT });
    const items = await listing.all();

    return items.map(mapModQueueItem);
  }

  async approve(thingId: string): Promise<void> {
    const id = normalizeThingId(thingId);
    await reddit.approve(id);
  }

  async remove(thingId: string): Promise<void> {
    const id = normalizeThingId(thingId);
    await reddit.remove(id, false);
  }

  async markSpam(thingId: string): Promise<void> {
    const id = normalizeThingId(thingId);
    await reddit.remove(id, true);
  }

  async ignoreReports(thingId: string): Promise<void> {
    const trimmed = thingId.trim();
    if (trimmed.startsWith('t3_')) {
      const post = await reddit.getPostById(trimmed as T3);
      await post.ignoreReports();
      return;
    }
    if (trimmed.startsWith('t1_')) {
      const comment = await reddit.getCommentById(trimmed as T1);
      await comment.ignoreReports();
      return;
    }
    throw new Error(`Invalid thing id: ${thingId}`);
  }
}
