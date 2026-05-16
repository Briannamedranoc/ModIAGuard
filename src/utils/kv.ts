import { redis } from '@devvit/web/server';

const MAX_LIST_LENGTH = 500;

function parseList(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/** List helpers on top of Devvit Redis (LPUSH/LRANGE semantics). */
export const kv = {
  async lpush(key: string, value: string): Promise<void> {
    const list = parseList(await redis.get(key));
    list.unshift(value);
    await redis.set(key, JSON.stringify(list.slice(0, MAX_LIST_LENGTH)));
  },

  async lrange(key: string, start: number, end: number): Promise<string[]> {
    const list = parseList(await redis.get(key));
    if (list.length === 0) {
      return [];
    }
    const safeStart = Math.max(0, start);
    const safeEnd = end < 0 ? list.length + end : end;
    return list.slice(safeStart, safeEnd + 1);
  },
};
