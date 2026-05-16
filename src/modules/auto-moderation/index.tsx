import { useCallback, useState } from 'react';
import { AlertCircle, Loader2, Zap } from 'lucide-react';
import { LoadingOverlay } from '../../client/components/LoadingOverlay';
import { ModulePage } from '../../client/components/ModulePage';
import { DEFAULT_SUBREDDIT } from '../../client/config/constants';
import { NAV_ITEMS } from '../../client/config/navigation';
import { scoreToPercent } from '../../client/utils/riskStyles';

const config = NAV_ITEMS.find((item) => item.path === '/auto-moderation')!;

type RunResult = {
  thingId: string;
  recommendation: string;
  actionTaken: string;
  toxicityScore: number;
  spamScore: number;
};

type RunSuccess = {
  ok: true;
  data: { results: RunResult[]; processed: number; queueEmpty: boolean };
};
type ApiFailure = { ok: false; error: string };

function actionBadgeClass(action: string): string {
  switch (action) {
    case 'approve':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'remove':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
    case 'spam':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
    case 'ignore_reports':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    default:
      return 'border-slate-600/50 bg-slate-800/80 text-slate-300';
  }
}

export function AutoModerationModule() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const [queueEmpty, setQueueEmpty] = useState(false);
  const [error, setError] = useState('');
  const [hasRun, setHasRun] = useState(false);

  const runAutoModeration = useCallback(async () => {
    setLoading(true);
    setError('');
    setHasRun(true);
    try {
      const res = await fetch('/api/auto-moderation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subreddit: DEFAULT_SUBREDDIT }),
      });
      const data = (await res.json()) as RunSuccess | ApiFailure;
      if (!res.ok || !data.ok) {
        throw new Error(!data.ok ? data.error : `Request failed (${res.status})`);
      }
      setResults(data.data.results);
      setQueueEmpty(data.data.queueEmpty);
    } catch (err) {
      setResults([]);
      setQueueEmpty(false);
      setError(err instanceof Error ? err.message : 'Auto-moderation failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ModulePage
      title={config.label}
      description={config.description}
      icon={config.icon}
      loadedMessage="Auto-moderation ready"
    >
      <div className="relative min-h-[12rem]">
        <LoadingOverlay active={loading} label="Running auto-moderation on mod queue…" />

        <div className="flex flex-col gap-6">
          <article className="card-enter rounded-xl border border-violet-500/20 bg-slate-900 p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-100">Automatic moderation</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Scans the mod queue for r/{DEFAULT_SUBREDDIT}, analyzes each item with toxicity +
                  spam + AI, then applies approve, remove, spam, or needs-context actions. Every
                  action is logged with <span className="font-mono text-violet-300">auto: true</span>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void runAutoModeration()}
              disabled={loading}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-violet-500 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Run Auto-Moderation Now
                </>
              )}
            </button>
          </article>

          {error ? (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4" role="alert">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <p className="text-sm text-rose-200/90">{error}</p>
            </div>
          ) : null}

          {hasRun && !loading && !error && queueEmpty ? (
            <p className="card-enter rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-8 text-center text-sm font-medium text-emerald-200 shadow-md">
              Queue is clean!
            </p>
          ) : null}

          {results.length > 0 ? (
            <article className="card-enter overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900 shadow-md">
              <div className="border-b border-slate-800/80 px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-200">Results ({results.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-medium">Thing ID</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                      <th className="px-4 py-3 font-medium">Toxicity</th>
                      <th className="px-4 py-3 font-medium">Spam</th>
                      <th className="px-4 py-3 font-medium">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row) => (
                      <tr key={row.thingId} className="border-b border-slate-800/50 last:border-b-0">
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{row.thingId}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${actionBadgeClass(row.actionTaken)}`}>
                            {row.actionTaken}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-300">{scoreToPercent(row.toxicityScore)}%</td>
                        <td className="px-4 py-3 tabular-nums text-slate-300">{scoreToPercent(row.spamScore)}%</td>
                        <td className="px-4 py-3 uppercase text-violet-300">{row.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </ModulePage>
  );
}

export default AutoModerationModule;
