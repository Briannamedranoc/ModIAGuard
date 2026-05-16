import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, FlaskConical, Trash2 } from 'lucide-react';
import { LoadingOverlay } from '../../client/components/LoadingOverlay';
import { ModulePage } from '../../client/components/ModulePage';
import { DEFAULT_SUBREDDIT } from '../../client/config/constants';
import { NAV_ITEMS } from '../../client/config/navigation';
import { ReportAiRecommendation } from '../report-review/ReportAiRecommendation';

const config = NAV_ITEMS.find((item) => item.path === '/demo-mode')!;

type DemoPost = {
  id: string;
  title: string;
  body: string;
};

type ListSuccess = { ok: true; data: { items: DemoPost[] } };
type ApiFailure = { ok: false; error: string };

export function DemoModeModule() {
  const [loading, setLoading] = useState(false);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [count, setCount] = useState(6);
  const [items, setItems] = useState<DemoPost[]>([]);
  const [error, setError] = useState('');

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/demo/list?subreddit=${encodeURIComponent(DEFAULT_SUBREDDIT)}`,
      );
      const data = (await res.json()) as ListSuccess | ApiFailure;
      if (!res.ok || !data.ok) {
        throw new Error(!data.ok ? data.error : 'Failed to load demo posts');
      }
      setItems(data.data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load demo posts');
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/demo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subreddit: DEFAULT_SUBREDDIT, count }),
      });
      const data = (await res.json()) as ListSuccess | ApiFailure;
      if (!res.ok || !data.ok) {
        throw new Error(!data.ok ? data.error : 'Generate failed');
      }
      setItems(data.data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generate failed');
    } finally {
      setLoading(false);
    }
  }, [count]);

  const clearAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/demo/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subreddit: DEFAULT_SUBREDDIT }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? 'Clear failed');
      }
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const simulateAction = useCallback(
    async (post: DemoPost, action: string) => {
      setActionPending(post.id);
      setError('');
      try {
        const res = await fetch('/api/demo/simulate-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subreddit: DEFAULT_SUBREDDIT,
            thingId: post.id,
            title: post.title,
            body: post.body,
            action,
          }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string };
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? 'Simulation failed');
        }
        setItems((current) => current.filter((item) => item.id !== post.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Simulation failed');
      } finally {
        setActionPending(null);
      }
    },
    [],
  );

  const showOverlay = loading || actionPending != null;

  return (
    <ModulePage
      title={config.label}
      description={config.description}
      icon={config.icon}
      loadedMessage="Demo mode ready"
    >
      <div className="relative min-h-[12rem]">
        <LoadingOverlay
          active={showOverlay}
          label={loading ? 'Processing demo content…' : 'Simulating moderation action…'}
        />

        <div className="flex flex-col gap-6">
          <article className="card-enter rounded-xl border border-violet-500/20 bg-slate-900 p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
                <FlaskConical className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-100">Demo content for judges</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Generate fake posts (spam, toxic, mixed, normal) inside the dashboard only. No
                  Reddit API calls — actions are simulated and logged to DemoMode.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-500">Count</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value) || 6)}
                  className="mt-1 block w-24 rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <button
                type="button"
                onClick={() => void generate()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-violet-500 disabled:opacity-60"
              >
                <FlaskConical className="h-4 w-4" />
                Generate Demo Content
              </button>
              <button
                type="button"
                onClick={() => void clearAll()}
                disabled={loading || items.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Clear Demo Content
              </button>
            </div>
          </article>

          {error ? (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4" role="alert">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <p className="text-sm text-rose-200/90">{error}</p>
            </div>
          ) : null}

          {items.length === 0 && !loading ? (
            <p className="card-enter rounded-xl border border-slate-800/80 bg-slate-900/60 p-8 text-center text-sm text-slate-500 shadow-md">
              No demo posts yet. Generate sample content to try the AI pipeline.
            </p>
          ) : null}

          <div className="space-y-4">
            {items.map((post) => (
              <article
                key={post.id}
                className="card-enter rounded-xl border border-slate-800/80 bg-slate-900 p-6 shadow-md"
              >
                <ReportAiRecommendation
                  reportId={post.id}
                  text={[post.title, post.body].filter(Boolean).join('\n')}
                  onAnalysisChange={() => {}}
                />

                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Demo post · {post.id}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">{post.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{post.body}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(['approve', 'ignore_reports', 'spam', 'remove'] as const).map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={actionPending === post.id}
                      onClick={() => void simulateAction(post, action)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-500/40 hover:text-violet-200 disabled:opacity-60"
                    >
                      {action === 'ignore_reports' ? 'Needs context' : action}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </ModulePage>
  );
}

export default DemoModeModule;
