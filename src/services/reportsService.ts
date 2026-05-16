import { RedditAPI } from '../utils/redditApi';

export type SubredditReport = {
  id: string;
  author: string;
  type: 't3' | 't1';
  title: string | null;
  body: string | null;
  permalink: string;
  reports: [string, string][];
  createdUtc: number;
};

export async function getReportsForSubreddit(subreddit: string): Promise<SubredditReport[]> {
  const redditApi = new RedditAPI();
  const modQueue = await redditApi.getModQueue(subreddit);

  return modQueue.map((item) => ({
    id: item.id,
    author: item.author,
    type: item.kind,
    title: item.title ?? null,
    body: item.body ?? null,
    permalink: item.permalink,
    reports: item.mod_reports.concat(item.user_reports),
    createdUtc: item.created_utc,
  }));
}
