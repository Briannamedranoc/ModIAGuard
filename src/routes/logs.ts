import { Hono } from 'hono';
import { getLogs, getLogsByThingId } from '../services/logsService';

export const logsRouter = new Hono();

logsRouter.get('/list', async (c) => {
  const subreddit = c.req.query('subreddit')?.trim() || 'modaiguard_dev';
  const logs = await getLogs(subreddit, 100);
  return c.json({ ok: true, data: { logs } }, 200);
});

logsRouter.get('/item', async (c) => {
  const thingId = c.req.query('thingId');
  const subreddit = c.req.query('subreddit')?.trim();

  if (!thingId?.trim()) {
    return c.json({ ok: false, error: 'Missing thingId' }, 400);
  }

  const logs = await getLogsByThingId(thingId, subreddit || undefined);
  return c.json({ ok: true, data: { logs } }, 200);
});
