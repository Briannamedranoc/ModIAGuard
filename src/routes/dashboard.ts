import { Hono } from 'hono';
import { isT3 } from '@devvit/shared-types/tid.js';
import type { UiResponse } from '@devvit/web/shared';
import { reddit, redis } from '@devvit/web/server';

export const DASHBOARD_POST_TITLE = 'AI Auto-Analyzer Dashboard';
const REDIS_KEY_PREFIX = 'modaiguard:dashboard-post:';

function redisKey(subredditName: string): string {
  return `${REDIS_KEY_PREFIX}${subredditName.toLowerCase()}`;
}

async function findExistingDashboardPost(subredditName: string) {
  const listing = await reddit.getNewPosts({ subredditName, limit: 100 });
  const posts = await listing.all();
  return posts.find((p) => p.title === DASHBOARD_POST_TITLE);
}

async function createDashboardWebPost(subredditName: string) {
  type WebSubmitPost = {
    title: string;
    subredditName: string;
    preview: false;
    url: 'web:client/index.html';
  };

  try {
    return await reddit.submitPost({
      title: DASHBOARD_POST_TITLE,
      subredditName,
      preview: false,
      url: 'web:client/index.html',
    } as WebSubmitPost & Parameters<typeof reddit.submitPost>[0]);
  } catch {
    return reddit.submitCustomPost({
      subredditName,
      title: DASHBOARD_POST_TITLE,
      entry: 'default',
      textFallback: {
        text: 'Open the ModAiGuard AI Auto-Analyzer Dashboard.',
      },
    });
  }
}

async function resolveDashboardPost(subredditName: string) {
  const key = redisKey(subredditName);

  const cachedId = await redis.get(key);
  if (cachedId && isT3(cachedId)) {
    try {
      return await reddit.getPostById(cachedId);
    } catch {
      await redis.del(key);
    }
  }

  const existing = await findExistingDashboardPost(subredditName);
  if (existing) {
    await redis.set(key, existing.id);
    return existing;
  }

  const created = await createDashboardWebPost(subredditName);
  await redis.set(key, created.id);
  return created;
}

export const dashboard = new Hono();

dashboard.post('/open-dashboard', async (c) => {
  try {
    const subreddit = await reddit.getCurrentSubreddit();
    const subredditName = subreddit.name;
    const post = await resolveDashboardPost(subredditName);

    return c.json<UiResponse & { postId: string }>(
      {
        postId: post.id,
        navigateTo: { url: post.url },
      },
      200
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not open dashboard.';
    return c.json<UiResponse>({ showToast: message }, 200);
  }
});
