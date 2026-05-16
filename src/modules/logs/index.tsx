import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { LogEntryCard, type LogEntryView } from '../../client/components/LogEntryCard';
import { LoadingOverlay } from '../../client/components/LoadingOverlay';
import { ModulePage } from '../../client/components/ModulePage';
import { DEFAULT_SUBREDDIT } from '../../client/config/constants';
import { NAV_ITEMS } from '../../client/config/navigation';

const config = NAV_ITEMS.find((item) => item.path === '/logs')!;

type ListSuccess = { ok: true; data: { logs: LogEntryView[] } };
type ApiFailure = { ok: false; error: string };

export function LogsModule() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntryView[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/logs/list?subreddit=${encodeURIComponent(DEFAULT_SUBREDDIT)}`,
        );
        const data = (await res.json()) as ListSuccess | ApiFailure;

        if (!res.ok || !data.ok) {
          throw new Error(!data.ok ? data.error : `Request failed (${res.status})`);
        }

        setLogs(data.data.logs);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load logs';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <ModulePage
      title={config.label}
      description={config.description}
      icon={config.icon}
      loadedMessage="Logs module loaded"
    >
      <div className="relative min-h-[12rem]">
        <LoadingOverlay active={loading} label="Loading moderation logs…" />

        {error ? (
          <div
            className="card-enter flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 transition-all duration-500"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <p className="text-sm text-rose-200/90">{error}</p>
          </div>
        ) : null}

        {!loading && !error && logs.length === 0 ? (
          <p className="card-enter rounded-xl border border-slate-800/80 bg-slate-900/60 p-8 text-center text-sm text-slate-500 shadow-md transition-all duration-500">
            No moderation actions logged yet.
          </p>
        ) : null}

        <div className="space-y-3">
          {logs.map((log) => (
            <LogEntryCard key={log.id} log={log} />
          ))}
        </div>
      </div>
    </ModulePage>
  );
}

export default LogsModule;
