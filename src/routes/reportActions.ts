import { Hono } from 'hono';
import { performModAction } from '../services/reportActionsService';
import type { AIRecommendation } from '../services/logsService';

type ModActionBody = {
  subreddit?: string;
  thingId?: string;
  action?: string;
  title?: string | null;
  body?: string | null;
  toxicityScore?: number | null;
  spamScore?: number | null;
  aiRecommendation?: AIRecommendation | null;
};

export const reportActionsRouter = new Hono();

reportActionsRouter.post('/action', async (c) => {
  const body = await c.req.json<ModActionBody>();

  const {
    subreddit,
    thingId,
    action,
    title,
    body: contentBody,
    toxicityScore,
    spamScore,
    aiRecommendation,
  } = body;

  if (!subreddit?.trim()) {
    return c.json({ ok: false, error: 'Missing required field: subreddit' }, 400);
  }
  if (!thingId?.trim()) {
    return c.json({ ok: false, error: 'Missing required field: thingId' }, 400);
  }
  if (!action?.trim()) {
    return c.json({ ok: false, error: 'Missing required field: action' }, 400);
  }

  try {
    const result = await performModAction(subreddit, thingId, action, {
      title: title ?? null,
      body: contentBody ?? null,
      toxicityScore: toxicityScore ?? null,
      spamScore: spamScore ?? null,
      aiRecommendation: aiRecommendation ?? null,
    });
    return c.json({ ok: true, data: { result } }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Action failed';
    return c.json({ ok: false, error: message }, 500);
  }
});
