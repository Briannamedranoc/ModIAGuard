import { Hono } from 'hono';
import { runAutoModeration } from '../services/autoModerationService';

type RunBody = {
  subreddit?: string;
};

export const autoModerationRouter = new Hono();

autoModerationRouter.post('/run', async (c) => {
  const body = await c.req.json<RunBody>().catch(() => ({} as RunBody));
  const subreddit = body.subreddit?.trim();

  if (!subreddit) {
    return c.json({ ok: false, error: 'Missing required field: subreddit' }, 400);
  }

  try {
    const results = await runAutoModeration(subreddit);
    return c.json(
      {
        ok: true,
        data: {
          results,
          processed: results.length,
          queueEmpty: results.length === 0,
        },
      },
      200,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Auto-moderation failed';
    return c.json({ ok: false, error: message }, 500);
  }
});
