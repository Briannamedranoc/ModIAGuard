import type { PostV2 } from '@devvit/web/shared';
import type { T3 } from '@devvit/shared-types/tid.js';
import { isT3 } from '@devvit/shared-types/tid.js';

/** Reddit fullnames for posts always use the t3_ prefix. */
export function normalizePostId(rawId: string): T3 | undefined {
  const trimmed = rawId.trim();
  if (!trimmed) {
    return undefined;
  }

  const fullname = trimmed.startsWith('t3_') ? trimmed : `t3_${trimmed}`;
  return isT3(fullname) ? fullname : undefined;
}

/** Combine fields moderators usually care about for text rules. */
export function collectPostText(post: PostV2): string {
  const parts = [post.title, post.selftext];
  if (!post.isSelf && post.url) {
    parts.push(post.url);
  }

  return parts.filter(Boolean).join('\n');
}

const URL_REGEX = /\bhttps?:\/\/[^\s<>"')]+/gi;

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ?? [];
}

export function summarizePostForLog(post: PostV2): string {
  return JSON.stringify(
    {
      id: post.id,
      title: post.title,
      isSelf: post.isSelf,
      url: post.url,
      selftextPreview:
        post.selftext.length > 160
          ? `${post.selftext.slice(0, 160)}…`
          : post.selftext,
    },
    null,
    2
  );
}
