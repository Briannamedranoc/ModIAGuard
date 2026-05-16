import { Hono } from 'hono';
import { analyzeToxicity } from '../services/toxicityService';

type AnalyzeToxicityBody = {
  text?: string;
};

export const toxicityRouter = new Hono();

toxicityRouter.post('/analyze', async (c) => {
  const body = await c.req.json<AnalyzeToxicityBody>();

  if (typeof body.text !== 'string' || body.text.trim().length === 0) {
    return c.json({ ok: false, error: 'Missing required field: text' }, 400);
  }

  const analysis = await analyzeToxicity(body.text);
  return c.json({ ok: true, data: { analysis } }, 200);
});
