/** Build a best-effort Reddit URL from a thing fullname (t3_ / t1_). */
export function redditThingUrl(thingId: string, subreddit: string): string {
  const match = /^t(\d)_(.+)$/i.exec(thingId.trim());
  const sub = subreddit.replace(/^r\//i, '');

  if (!match) {
    return `https://www.reddit.com/r/${sub}/`;
  }

  const [, type, id] = match;
  if (type === '3') {
    return `https://www.reddit.com/r/${sub}/comments/${id}/`;
  }
  if (type === '1') {
    return `https://www.reddit.com/r/${sub}/comments/-/comment/${id}/`;
  }

  return `https://www.reddit.com/r/${sub}/`;
}
