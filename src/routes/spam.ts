import { Hono } from 'hono';
import { analyzeSpam } from '../services/spamService';

type AnalyzeSpamBody = {
  text?: string;
};

export const spamRouter = new Hono();

spamRouter.post('/analyze', async (c) => {
  const body = await c.req.json<AnalyzeSpamBody>();

  if (typeof body.text !== 'string' || body.text.trim().length === 0) {
    return c.json({ ok: false, error: 'Missing required field: text' }, 400);
  }

  const analysis = await analyzeSpam(body.text);
  return c.json({ ok: true, data: { analysis } }, 200);
});
