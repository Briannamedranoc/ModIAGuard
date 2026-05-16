import { Hono } from 'hono';
import { deleteRule, listRules, saveRule, setRuleEnabled } from '../services/autoResponderService';

type CreateRuleBody = {
  subreddit?: string;
  triggers?: string | string[];
  response?: string;
  enabled?: boolean;
};

type DeleteRuleBody = {
  subreddit?: string;
  id?: string;
};

type ToggleRuleBody = {
  subreddit?: string;
  id?: string;
  enabled?: boolean;
};

function parseTriggers(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((t) => t.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export const autoResponderRouter = new Hono();

autoResponderRouter.post('/create', async (c) => {
  const body = await c.req.json<CreateRuleBody>();

  if (!body.subreddit?.trim()) {
    return c.json({ ok: false, error: 'Missing subreddit' }, 400);
  }
  if (!body.response?.trim()) {
    return c.json({ ok: false, error: 'Missing response' }, 400);
  }

  const triggers = parseTriggers(body.triggers);
  if (triggers.length === 0) {
    return c.json({ ok: false, error: 'Missing triggers' }, 400);
  }

  try {
    const rule = await saveRule(body.subreddit, {
      triggers,
      response: body.response,
      enabled: body.enabled ?? true,
    });
    return c.json({ ok: true, data: { rule } }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create rule';
    return c.json({ ok: false, error: message }, 500);
  }
});

autoResponderRouter.get('/list', async (c) => {
  const subreddit = c.req.query('subreddit');
  if (!subreddit?.trim()) {
    return c.json({ ok: false, error: 'Missing subreddit' }, 400);
  }

  const rules = await listRules(subreddit);
  return c.json({ ok: true, data: { rules } }, 200);
});

autoResponderRouter.post('/toggle', async (c) => {
  const body = await c.req.json<ToggleRuleBody>();

  if (!body.subreddit?.trim() || !body.id?.trim()) {
    return c.json({ ok: false, error: 'Missing subreddit or id' }, 400);
  }
  if (typeof body.enabled !== 'boolean') {
    return c.json({ ok: false, error: 'Missing required field: enabled' }, 400);
  }

  const rule = await setRuleEnabled(body.subreddit, body.id, body.enabled);
  if (!rule) {
    return c.json({ ok: false, error: 'Rule not found' }, 404);
  }

  return c.json({ ok: true, data: { rule } }, 200);
});

autoResponderRouter.post('/delete', async (c) => {
  const body = await c.req.json<DeleteRuleBody>();

  if (!body.subreddit?.trim() || !body.id?.trim()) {
    return c.json({ ok: false, error: 'Missing subreddit or id' }, 400);
  }

  const deleted = await deleteRule(body.subreddit, body.id);
  if (!deleted) {
    return c.json({ ok: false, error: 'Rule not found' }, 404);
  }

  return c.json({ ok: true, data: { deleted: true } }, 200);
});
