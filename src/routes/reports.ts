import { Hono } from 'hono';
import { getReportsForSubreddit } from '../services/reportsService';

export const reportsRouter = new Hono();

reportsRouter.get('/list', async (c) => {
  const sub = c.req.query('subreddit');
  if (!sub?.trim()) {
    return c.json({ ok: false, error: 'Missing subreddit' }, 400);
  }

  const reports = await getReportsForSubreddit(sub);
  return c.json({ ok: true, data: { reports } }, 200);
});
