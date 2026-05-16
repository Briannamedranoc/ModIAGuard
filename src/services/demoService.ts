import { redis } from '@devvit/web/server';
import type { AIRecommendation } from './aiRecommendService';
import { addLogEntry } from './logsService';
import { analyzeItem } from './autoModerationService';

export type DemoPost = {
  id: string;
  title: string;
  body: string;
};

const DEMO_TEMPLATES: { title: string; body: string }[] = [
  {
    title: 'Limited offer',
    body: 'BUY NOW cheap promo! Visit my site https://spam.example.com free money free money',
  },
  {
    title: 'Heated reply',
    body: 'You are such an idiot. I hate people like you and will find you.',
  },
  {
    title: 'Sketchy mix',
    body: 'Click here buy now — also you are stupid trash',
  },
  {
    title: 'Community update',
    body: 'Thanks everyone for the thoughtful discussion this week. See you at the meetup!',
  },
  {
    title: 'Crypto pitch',
    body: 'FREE AIRDROP visit my site https://coin.example promo cheap invest now!!!',
  },
  {
    title: 'Borderline rant',
    body: 'This is frustrating but I want to understand your point of view better.',
  },
];

function demoKey(subreddit: string): string {
  const name = subreddit.trim().replace(/^r\//i, '');
  return `DEMO_POSTS_${name}`;
}

function normalizeSubreddit(subreddit: string): string {
  return subreddit.trim().replace(/^r\//i, '');
}

async function readPosts(subreddit: string): Promise<DemoPost[]> {
  const raw = await redis.get(demoKey(subreddit));
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as DemoPost[];
}

async function writePosts(subreddit: string, posts: DemoPost[]): Promise<void> {
  await redis.set(demoKey(subreddit), JSON.stringify(posts));
}

export async function generateFakePosts(
  subreddit: string,
  count: number,
): Promise<DemoPost[]> {
  const normalized = normalizeSubreddit(subreddit);
  if (!normalized) {
    throw new Error('Invalid subreddit');
  }

  const safeCount = Math.min(20, Math.max(1, Math.floor(count)));
  const generated: DemoPost[] = [];

  for (let i = 0; i < safeCount; i++) {
    const template = DEMO_TEMPLATES[i % DEMO_TEMPLATES.length]!;
    generated.push({
      id: `t3_demo_${crypto.randomUUID().slice(0, 8)}`,
      title: template.title,
      body: template.body,
    });
  }

  await writePosts(normalized, generated);
  return generated;
}

export async function listDemoPosts(subreddit: string): Promise<DemoPost[]> {
  const normalized = normalizeSubreddit(subreddit);
  if (!normalized) {
    return [];
  }
  return readPosts(normalized);
}

export async function clearDemoPosts(subreddit: string): Promise<void> {
  const normalized = normalizeSubreddit(subreddit);
  if (!normalized) {
    return;
  }
  await redis.del(demoKey(normalized));
}

function recommendationToAction(recommendation: AIRecommendation): string {
  switch (recommendation) {
    case 'remove':
      return 'remove';
    case 'spam':
      return 'spam';
    case 'needs_context':
      return 'ignore_reports';
    case 'approve':
      return 'approve';
  }
}

export async function simulateDemoAction(params: {
  subreddit: string;
  thingId: string;
  text: string;
  action?: string;
}): Promise<{
  actionTaken: string;
  recommendation: AIRecommendation;
  toxicityScore: number;
  spamScore: number;
}> {
  const analysis = await analyzeItem(params.text);
  const actionTaken = params.action?.trim() || recommendationToAction(analysis.recommendation);

  await addLogEntry({
    moderator: 'demo',
    action: actionTaken,
    thingId: params.thingId,
    subreddit: params.subreddit,
    source: 'DemoMode',
    toxicityScore: analysis.toxicityScore,
    spamScore: analysis.spamScore,
    aiRecommendation: analysis.recommendation,
    auto: false,
  });

  return {
    actionTaken,
    recommendation: analysis.recommendation,
    toxicityScore: analysis.toxicityScore,
    spamScore: analysis.spamScore,
  };
}
