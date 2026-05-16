export type ToxicityAnalysis = {
  toxicityScore: number;
  categories: {
    insult: number;
    threat: number;
    hate: number;
  };
};

const EMPTY_CATEGORIES = { insult: 0, threat: 0, hate: 0 };

const EMPTY_RESULT: ToxicityAnalysis = {
  toxicityScore: 0,
  categories: { ...EMPTY_CATEGORIES },
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function normalizeAnalysis(raw: Partial<ToxicityAnalysis>): ToxicityAnalysis {
  const insult = clamp01(raw.categories?.insult ?? 0);
  const threat = clamp01(raw.categories?.threat ?? 0);
  const hate = clamp01(raw.categories?.hate ?? 0);
  const maxCategory = Math.max(insult, threat, hate);
  const toxicityScore = clamp01(raw.toxicityScore ?? maxCategory);

  if (toxicityScore === 0 && insult === 0 && threat === 0 && hate === 0) {
    return { ...EMPTY_RESULT, categories: { ...EMPTY_CATEGORIES } };
  }

  return {
    toxicityScore,
    categories: { insult, threat, hate },
  };
}

const INSULT_TERMS = ['idiot', 'stupid', 'moron', 'dumb', 'loser', 'trash', 'idiota', 'estupido'];
const THREAT_TERMS = ['kill', 'hurt', 'attack', 'destroy you', 'find you', 'te voy a', 'te mato'];
const HATE_TERMS = ['hate', 'racist', 'nazi', 'odio', 'basura humana'];

function countMatches(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => (lower.includes(term) ? count + 1 : count), 0);
}

/** Local fallback when OpenAI is unavailable (no API key or request failure). */
function analyzeToxicityHeuristic(text: string): ToxicityAnalysis {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ...EMPTY_RESULT, categories: { ...EMPTY_CATEGORIES } };
  }

  const insultHits = countMatches(trimmed, INSULT_TERMS);
  const threatHits = countMatches(trimmed, THREAT_TERMS);
  const hateHits = countMatches(trimmed, HATE_TERMS);

  const insult = clamp01(insultHits * 0.25);
  const threat = clamp01(threatHits * 0.35);
  const hate = clamp01(hateHits * 0.3);
  const toxicityScore = clamp01(Math.max(insult, threat, hate));

  return normalizeAnalysis({
    toxicityScore,
    categories: { insult, threat, hate },
  });
}

async function analyzeToxicityWithOpenAI(text: string): Promise<ToxicityAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return analyzeToxicityHeuristic(text);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a content moderation assistant. Analyze the user text for toxicity. Respond with JSON only using this exact shape: {"toxicityScore":0.0,"categories":{"insult":0.0,"threat":0.0,"hate":0.0}}. All values must be numbers from 0 to 1. Use 0 when there is no signal for a category. toxicityScore should reflect overall toxicity (typically the max of categories, but may be higher if multiple signals exist).',
        },
        {
          role: 'user',
          content: text.slice(0, 12_000),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty content');
  }

  const parsed = JSON.parse(content) as Partial<ToxicityAnalysis>;
  return normalizeAnalysis(parsed);
}

export async function analyzeToxicity(text: string): Promise<ToxicityAnalysis> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ...EMPTY_RESULT, categories: { ...EMPTY_CATEGORIES } };
  }

  try {
    return await analyzeToxicityWithOpenAI(trimmed);
  } catch {
    return { ...EMPTY_RESULT, categories: { ...EMPTY_CATEGORIES } };
  }
}
