import { Hono } from 'hono';
import { getModerations } from '../services/moderationsService';

export const moderationsRouter = new Hono();

moderationsRouter.get('/list', async (c) => {
  const subreddit = c.req.query('subreddit')?.trim();

  if (!subreddit) {
    return c.json({ ok: false, error: 'Missing subreddit' }, 400);
  }

  const moderations = await getModerations(subreddit, 500);
  return c.json({ ok: true, moderations }, 200);
});
