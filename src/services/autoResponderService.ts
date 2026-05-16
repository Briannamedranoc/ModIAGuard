import { redis } from '@devvit/web/server';

export type AutoResponderRule = {
  id: string;
  triggers: string[];
  response: string;
  enabled: boolean;
  createdAt: number;
};

export type AutoResponderRuleInput = {
  triggers: string[];
  response: string;
  enabled: boolean;
};

function rulesKey(subreddit: string): string {
  const name = subreddit.trim().replace(/^r\//i, '');
  return `AI_RESPONDER_RULES_${name}`;
}

function normalizeSubreddit(subreddit: string): string {
  return subreddit.trim().replace(/^r\//i, '');
}

async function readRules(subreddit: string): Promise<AutoResponderRule[]> {
  const raw = await redis.get(rulesKey(subreddit));
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as AutoResponderRule[];
}

async function writeRules(subreddit: string, rules: AutoResponderRule[]): Promise<void> {
  await redis.set(rulesKey(subreddit), JSON.stringify(rules));
}

export async function saveRule(
  subreddit: string,
  input: AutoResponderRuleInput,
): Promise<AutoResponderRule> {
  const normalized = normalizeSubreddit(subreddit);
  if (!normalized) {
    throw new Error('Invalid subreddit');
  }

  const rules = await readRules(normalized);
  const rule: AutoResponderRule = {
    id: crypto.randomUUID(),
    triggers: input.triggers.map((t) => t.trim()).filter(Boolean),
    response: input.response.trim(),
    enabled: input.enabled,
    createdAt: Date.now(),
  };

  rules.unshift(rule);
  await writeRules(normalized, rules);
  return rule;
}

export async function listRules(subreddit: string): Promise<AutoResponderRule[]> {
  const normalized = normalizeSubreddit(subreddit);
  if (!normalized) {
    return [];
  }

  const rules = await readRules(normalized);
  return rules.sort((a, b) => b.createdAt - a.createdAt);
}

export async function setRuleEnabled(
  subreddit: string,
  id: string,
  enabled: boolean,
): Promise<AutoResponderRule | null> {
  const normalized = normalizeSubreddit(subreddit);
  if (!normalized || !id.trim()) {
    return null;
  }

  const rules = await readRules(normalized);
  const index = rules.findIndex((rule) => rule.id === id);
  if (index < 0) {
    return null;
  }

  const current = rules[index]!;
  const updated: AutoResponderRule = { ...current, enabled };
  rules[index] = updated;
  await writeRules(normalized, rules);
  return updated;
}

export async function deleteRule(subreddit: string, id: string): Promise<boolean> {
  const normalized = normalizeSubreddit(subreddit);
  if (!normalized || !id.trim()) {
    return false;
  }

  const rules = await readRules(normalized);
  const next = rules.filter((rule) => rule.id !== id);
  if (next.length === rules.length) {
    return false;
  }

  await writeRules(normalized, next);
  return true;
}

export async function matchRules(
  subreddit: string,
  text: string,
): Promise<AutoResponderRule | null> {
  const normalized = normalizeSubreddit(subreddit);
  const haystack = text.trim().toLowerCase();
  if (!normalized || !haystack) {
    return null;
  }

  const rules = await listRules(normalized);
  for (const rule of rules) {
    if (!rule.enabled) {
      continue;
    }
    for (const trigger of rule.triggers) {
      const needle = trigger.trim().toLowerCase();
      if (needle && haystack.includes(needle)) {
        return rule;
      }
    }
  }

  return null;
}
