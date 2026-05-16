import { Hono } from 'hono';
import {
  clearDemoPosts,
  generateFakePosts,
  listDemoPosts,
  simulateDemoAction,
} from '../services/demoService';

type GenerateBody = {
  subreddit?: string;
  count?: number;
};

type SimulateBody = {
  subreddit?: string;
  thingId?: string;
  title?: string;
  body?: string;
  action?: string;
};

export const demoRouter = new Hono();

demoRouter.post('/generate', async (c) => {
  const body = await c.req.json<GenerateBody>();

  if (!body.subreddit?.trim()) {
    return c.json({ ok: false, error: 'Missing required field: subreddit' }, 400);
  }

  const count = body.count ?? 6;

  try {
    const items = await generateFakePosts(body.subreddit, count);
    return c.json({ ok: true, data: { items } }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate demo content';
    return c.json({ ok: false, error: message }, 500);
  }
});

demoRouter.get('/list', async (c) => {
  const subreddit = c.req.query('subreddit')?.trim();

  if (!subreddit) {
    return c.json({ ok: false, error: 'Missing subreddit' }, 400);
  }

  const items = await listDemoPosts(subreddit);
  return c.json({ ok: true, data: { items } }, 200);
});

demoRouter.post('/clear', async (c) => {
  const body = await c.req.json<{ subreddit?: string }>();

  if (!body.subreddit?.trim()) {
    return c.json({ ok: false, error: 'Missing required field: subreddit' }, 400);
  }

  await clearDemoPosts(body.subreddit);
  return c.json({ ok: true, data: { cleared: true } }, 200);
});

demoRouter.post('/simulate-action', async (c) => {
  const body = await c.req.json<SimulateBody>();

  if (!body.subreddit?.trim()) {
    return c.json({ ok: false, error: 'Missing required field: subreddit' }, 400);
  }
  if (!body.thingId?.trim()) {
    return c.json({ ok: false, error: 'Missing required field: thingId' }, 400);
  }

  const text = [body.title, body.body].filter(Boolean).join('\n').trim();
  if (!text) {
    return c.json({ ok: false, error: 'Missing post content' }, 400);
  }

  try {
    const result = await simulateDemoAction({
      subreddit: body.subreddit,
      thingId: body.thingId,
      text,
      ...(body.action?.trim() ? { action: body.action.trim() } : {}),
    });
    return c.json({ ok: true, data: { result } }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Simulation failed';
    return c.json({ ok: false, error: message }, 500);
  }
});
