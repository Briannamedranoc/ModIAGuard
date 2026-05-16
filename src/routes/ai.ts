import { Hono } from 'hono';
import { recommendAction } from '../services/aiRecommendService';

type RecommendBody = {
  toxicity?: number;
  spam?: number;
};

export const aiRouter = new Hono();

aiRouter.post('/recommend', async (c) => {
  const body = await c.req.json<RecommendBody>();

  if (typeof body.toxicity !== 'number' || typeof body.spam !== 'number') {
    return c.json({ ok: false, error: 'Missing toxicity or spam score' }, 400);
  }

  const recommendation = recommendAction({
    toxicity: body.toxicity,
    spam: body.spam,
  });

  return c.json({ ok: true, data: { recommendation } }, 200);
});
