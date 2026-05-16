import { Hono } from 'hono';
import type {
  OnAppInstallRequest,
  OnPostSubmitRequest,
  TriggerResponse,
} from '@devvit/web/shared';
import { reddit } from '@devvit/web/server';
import { runModerationRules } from '../rules';
import {
  collectPostText,
  extractUrls,
  normalizePostId,
  summarizePostForLog,
} from '../utils';

const SKIP_USERNAMES = new Set(['automoderator']);

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  const input = await c.req.json<OnAppInstallRequest>();
  console.log('[Mod Guardian] App installed to subreddit: r/' + input.subreddit?.name);

  return c.json<TriggerResponse>(
    {
      status: 'ok',
    },
    200
  );
});

triggers.post('/on-post-submit', async (c) => {
  const input = await c.req.json<OnPostSubmitRequest>();

  if ('type' in input && input.type !== 'PostSubmit') {
    console.warn('[Mod Guardian] Unexpected trigger type:', input.type);
    return c.json<TriggerResponse>({}, 200);
  }

  const post = input.post;
  const author = input.author;

  if (!post) {
    console.warn('[Mod Guardian] PostSubmit trigger missing post payload');
    return c.json<TriggerResponse>({}, 200);
  }

  if (post.deleted || post.spam) {
    console.log('[Mod Guardian] Skipping already deleted/spam post', post.id);
    return c.json<TriggerResponse>({}, 200);
  }

  const authorKey = author?.name?.trim().toLowerCase();
  if (authorKey && SKIP_USERNAMES.has(authorKey)) {
    console.log('[Mod Guardian] Skipping trusted automation author:', author?.name);
    return c.json<TriggerResponse>({}, 200);
  }

  console.log('[Mod Guardian] Post submit — payload summary:\n' + summarizePostForLog(post));
  console.log('[Mod Guardian] Author:', author?.name ?? '(unknown)');

  const text = collectPostText(post);
  const urlsFromBody = extractUrls(text);
  const urlsFromMedia = post.mediaUrls ?? [];
  const urls = [...urlsFromBody, ...urlsFromMedia];

  const { violations } = runModerationRules(text, urls);

  if (violations.length === 0) {
    console.log('[Mod Guardian] No violations — post OK:', post.id);
    return c.json<TriggerResponse>({ status: 'ok' }, 200);
  }

  for (const violation of violations) {
    console.warn(`[Mod Guardian] RULE [${violation.ruleId}] ${violation.message}`);
  }

  const postId = normalizePostId(post.id);
  if (!postId) {
    console.error('[Mod Guardian] Unable to normalize post id:', post.id);
    return c.json<TriggerResponse>({}, 200);
  }

  const reason = violations.map((v) => `${v.ruleId}: ${v.message}`).join(' | ');

  try {
    await reddit.filter(postId, `[Mod Guardian] ${reason}`, undefined);
    console.log('[Mod Guardian] Filtered post (sent to mod queue):', postId);
  } catch (err) {
    console.error('[Mod Guardian] reddit.filter failed:', err);
  }

  return c.json<TriggerResponse>({ status: 'ok' }, 200);
});
