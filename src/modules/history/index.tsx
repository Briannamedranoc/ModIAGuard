import { useCallback, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { LogEntryCard, type LogEntryView } from '../../client/components/LogEntryCard';
import { LoadingOverlay } from '../../client/components/LoadingOverlay';
import { ModulePage } from '../../client/components/ModulePage';
import { NAV_ITEMS } from '../../client/config/navigation';

const config = NAV_ITEMS.find((item) => item.path === '/history')!;

type ListSuccess = { ok: true; data: { logs: LogEntryView[] } };
type ApiFailure = { ok: false; error: string };

export function HistoryModule() {
  const [thingId, setThingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntryView[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const searchHistory = useCallback(async () => {
    const id = thingId.trim();
    if (!id) {
      setError('Enter a Thing ID (e.g. t3_abc123).');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(`/api/logs/item?thingId=${encodeURIComponent(id)}`);
      const data = (await res.json()) as ListSuccess | ApiFailure;
      if (!res.ok || !data.ok) {
        throw new Error(!data.ok ? data.error : `Request failed (${res.status})`);
      }
      setLogs(data.data.logs);
    } catch (err) {
      setLogs([]);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [thingId]);

  return (
    <ModulePage
      title={config.label}
      description={config.description}
      icon={config.icon}
      loadedMessage="History ready"
    >
      <div className="relative min-h-[12rem]">
        <LoadingOverlay active={loading} label="Searching history…" />

        <div className="flex flex-col gap-6">
          <article className="card-enter rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-md transition-all duration-500">
            <label htmlFor="thing-id" className="text-sm font-semibold text-slate-200">
              Thing ID
            </label>
            <p className="mt-1 text-sm text-slate-500">
              Search moderation log entries for a specific post or comment ID.
            </p>
            <input
              id="thing-id"
              value={thingId}
              onChange={(e) => setThingId(e.target.value)}
              placeholder="t3_xxxxx or t1_xxxxx"
              className="mt-4 w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 font-mono text-sm text-slate-100 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              type="button"
              onClick={() => void searchHistory()}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-500 hover:bg-violet-500 disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              Buscar historial
            </button>
          </article>

          {error ? (
            <div
              className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <p className="text-sm text-rose-200/90">{error}</p>
            </div>
          ) : null}

          {searched && !loading && !error && logs.length === 0 ? (
            <p className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-8 text-center text-sm text-slate-500 shadow-md">
              No log entries found for this Thing ID.
            </p>
          ) : null}

          <div className="space-y-3">
            {logs.map((log) => (
              <LogEntryCard key={log.id} log={log} />
            ))}
          </div>
        </div>
      </div>
    </ModulePage>
  );
}

export default HistoryModule;
