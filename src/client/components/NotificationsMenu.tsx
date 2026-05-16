import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEFAULT_SUBREDDIT } from '../config/constants';

const SEEN_KEY = 'modaiguard-notifications-seen-at';
const POLL_MS = 60_000;

type ActivityItem = {
  id: string;
  thingId: string;
  action: string;
  ts: number;
  aiRecommendation?: string;
  toxicityScore?: number;
  spamScore?: number;
  autoResponse?: string;
};

function readLastSeenAt(): number {
  const raw = sessionStorage.getItem(SEEN_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function markAllSeen(): void {
  sessionStorage.setItem(SEEN_KEY, String(Date.now()));
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(ts).toLocaleDateString();
}

function actionLabel(action: string): string {
  switch (action) {
    case 'approve':
      return 'Approved';
    case 'remove':
      return 'Removed';
    case 'spam':
      return 'Marked spam';
    case 'ignore_reports':
      return 'Needs context';
    default:
      return action;
  }
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/logs/list?subreddit=${encodeURIComponent(DEFAULT_SUBREDDIT)}`,
      );
      const data = (await res.json()) as {
        ok: boolean;
        data?: { logs: ActivityItem[] };
        error?: string;
      };

      if (!res.ok || !data.ok || !data.data) {
        throw new Error(!data.ok ? data.error : 'Failed to load activity');
      }

      const logs = data.data.logs.slice(0, 12);
      setItems(logs);

      const lastSeen = readLastSeenAt();
      const unread = logs.filter((log) => log.ts > lastSeen).length;
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load activity');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivity();
    const interval = window.setInterval(() => void loadActivity(), POLL_MS);
    return () => window.clearInterval(interval);
  }, [loadActivity]);

  useEffect(() => {
    if (!open) {
      return;
    }

    markAllSeen();
    setUnreadCount(0);

    function onPointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) {
            void loadActivity();
          }
        }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-elevated)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
        aria-label="Moderation activity"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white ring-2 ring-[var(--app-surface)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl shadow-black/20">
          <div className="border-b border-[var(--app-border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--app-text)]">Moderation activity</p>
            <p className="mt-0.5 text-xs text-[var(--app-text-subtle)]">
              Recent actions from Report Review &amp; AI
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--app-text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : null}

            {error ? (
              <p className="px-4 py-6 text-center text-sm text-rose-500">{error}</p>
            ) : null}

            {!loading && !error && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--app-text-subtle)]">
                No moderation actions yet. Use Report Review to generate activity.
              </p>
            ) : null}

            {!loading && !error
              ? items.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-[var(--app-border)] px-4 py-3 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--app-text)]">
                        {actionLabel(item.action)}
                      </p>
                      <span className="shrink-0 text-[10px] text-[var(--app-text-subtle)]">
                        {timeAgo(item.ts)}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-[var(--app-text-muted)]">
                      {item.thingId}
                    </p>
                    {item.aiRecommendation ? (
                      <p className="mt-1 text-xs text-violet-500 dark:text-violet-300">
                        AI: {item.aiRecommendation.replace('_', ' ')}
                      </p>
                    ) : null}
                    {item.autoResponse ? (
                      <p className="mt-1 line-clamp-2 text-xs text-cyan-600 dark:text-cyan-300">
                        Auto-response matched
                      </p>
                    ) : null}
                  </div>
                ))
              : null}
          </div>

          <div className="border-t border-[var(--app-border)] p-2">
            <Link
              to="/moderations-panel"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-center text-xs font-medium text-violet-600 transition hover:bg-violet-500/10 dark:text-violet-300"
            >
              View full history →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
