import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { LoadingOverlay } from '../../client/components/LoadingOverlay';
import { ModulePage } from '../../client/components/ModulePage';
import { DEFAULT_SUBREDDIT } from '../../client/config/constants';
import { NAV_ITEMS } from '../../client/config/navigation';

const config = NAV_ITEMS.find((item) => item.path === '/auto-responder')!;

type AutoResponderRule = {
  id: string;
  triggers: string[];
  response: string;
  enabled: boolean;
  createdAt: number;
};

type ListSuccess = { ok: true; data: { rules: AutoResponderRule[] } };
type ApiFailure = { ok: false; error: string };

export function AutoResponderModule() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<AutoResponderRule[]>([]);
  const [error, setError] = useState('');
  const [triggers, setTriggers] = useState('');
  const [response, setResponse] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/auto-responder/list?subreddit=${encodeURIComponent(DEFAULT_SUBREDDIT)}`,
      );
      const data = (await res.json()) as ListSuccess | ApiFailure;
      if (!res.ok || !data.ok) {
        throw new Error(!data.ok ? data.error : `Request failed (${res.status})`);
      }
      setRules(data.data.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const createRule = useCallback(async () => {
    if (!triggers.trim() || !response.trim()) {
      setError('Triggers and response are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auto-responder/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subreddit: DEFAULT_SUBREDDIT,
          triggers,
          response,
          enabled,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? 'Failed to create rule');
      }
      setTriggers('');
      setResponse('');
      setEnabled(true);
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
    } finally {
      setSaving(false);
    }
  }, [triggers, response, enabled, loadRules]);

  const toggleRule = useCallback(
    async (id: string, nextEnabled: boolean) => {
      setTogglingId(id);
      setError('');
      try {
        const res = await fetch('/api/auto-responder/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subreddit: DEFAULT_SUBREDDIT, id, enabled: nextEnabled }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string };
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? 'Failed to update rule');
        }
        await loadRules();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update rule');
      } finally {
        setTogglingId(null);
      }
    },
    [loadRules],
  );

  const removeRule = useCallback(
    async (id: string) => {
      if (!window.confirm('Delete this auto-responder rule?')) {
        return;
      }

      setDeletingId(id);
      setError('');
      try {
        const res = await fetch('/api/auto-responder/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subreddit: DEFAULT_SUBREDDIT, id }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string };
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? 'Failed to delete rule');
        }
        await loadRules();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete rule');
      } finally {
        setDeletingId(null);
      }
    },
    [loadRules],
  );

  return (
    <ModulePage
      title={config.label}
      description={config.description}
      icon={config.icon}
      loadedMessage="Auto-Responder ready"
    >
      <div className="relative min-h-[12rem]">
        <LoadingOverlay
          active={loading || saving}
          label={
            deletingId
              ? 'Deleting rule…'
              : togglingId
                ? 'Updating rule…'
                : saving
                  ? 'Saving rule…'
                  : 'Loading rules…'
          }
        />

        <div className="flex flex-col gap-6">
          <article className="card-enter rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-md transition-all duration-500">
            <h3 className="text-sm font-semibold text-slate-200">Create rule</h3>
            <p className="mt-1 text-sm text-slate-500">
              Triggers are comma-separated phrases. First match wins when moderating content.
            </p>

            <label className="mt-4 block text-xs font-medium text-slate-400" htmlFor="triggers">
              Triggers
            </label>
            <textarea
              id="triggers"
              value={triggers}
              onChange={(e) => setTriggers(e.target.value)}
              rows={2}
              placeholder="spam, buy now, free money"
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            />

            <label className="mt-4 block text-xs font-medium text-slate-400" htmlFor="response">
              Auto response
            </label>
            <textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              placeholder="Thanks for reporting. Our mods are reviewing this…"
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            />

            <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500/30"
              />
              Rule enabled
            </label>

            <button
              type="button"
              onClick={() => void createRule()}
              disabled={saving}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-500 hover:bg-violet-500 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Save rule
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

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Saved rules ({rules.length})</h3>
            {!loading && rules.length === 0 ? (
              <p className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 text-center text-sm text-slate-500 shadow-md">
                No rules yet. Create one above.
              </p>
            ) : null}
            {rules.map((rule) => (
              <article
                key={rule.id}
                className="card-enter rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-md transition-all duration-500"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        disabled={togglingId === rule.id || deletingId === rule.id}
                        onChange={(e) => void toggleRule(rule.id, e.target.checked)}
                        className="rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500/30"
                      />
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </label>
                    <p className="mt-2 text-xs text-slate-500">
                      Triggers: {rule.triggers.join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeRule(rule.id)}
                    disabled={deletingId === rule.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    {deletingId === rule.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{rule.response}</p>
              </article>
            ))}
          </section>
        </div>
      </div>
    </ModulePage>
  );
}

export default AutoResponderModule;
