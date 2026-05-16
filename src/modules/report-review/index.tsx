import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { LoadingOverlay } from '../../client/components/LoadingOverlay';
import { ModulePage } from '../../client/components/ModulePage';
import { DEFAULT_SUBREDDIT } from '../../client/config/constants';
import { NAV_ITEMS } from '../../client/config/navigation';
import { ReportAiRecommendation } from './ReportAiRecommendation';
import type { ReportAiAnalysis } from './types';

const config = NAV_ITEMS.find((item) => item.path === '/report-review')!;

type ReportTuple = [string, string];

type SubredditReport = {
  id: string;
  author: string;
  type: 't3' | 't1';
  title: string | null;
  body: string | null;
  permalink: string;
  reports: ReportTuple[];
  createdUtc: number;
};

type ListSuccess = { ok: true; data: { reports: SubredditReport[] } };
type ListFailure = { ok: false; error: string };

export function ReportReviewModule() {
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [reports, setReports] = useState<SubredditReport[]>([]);
  const [error, setError] = useState('');
  const [aiByReportId, setAiByReportId] = useState<Record<string, ReportAiAnalysis>>({});

  const handleAnalysisChange = useCallback((reportId: string, analysis: ReportAiAnalysis) => {
    setAiByReportId((current) => ({ ...current, [reportId]: analysis }));
  }, []);

  const aiLoading = useMemo(
    () => Object.values(aiByReportId).some((entry) => entry.loading),
    [aiByReportId],
  );

  const showOverlay = loading || actionPending || aiLoading;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/reports/list?subreddit=${encodeURIComponent(DEFAULT_SUBREDDIT)}`,
        );
        const data = (await res.json()) as ListSuccess | ListFailure;

        if (!res.ok || !data.ok) {
          throw new Error(!data.ok ? data.error : `Request failed (${res.status})`);
        }

        setReports(data.data.reports);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load reports';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const handleAction = useCallback(
    async (report: SubredditReport, action: string) => {
      const meta = aiByReportId[report.id];

      setActionPending(true);
      try {
        const res = await fetch('/api/report-actions/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subreddit: DEFAULT_SUBREDDIT,
            thingId: report.id,
            action,
            title: report.title,
            body: report.body,
            toxicityScore: meta?.toxicityScore ?? null,
            spamScore: meta?.spamScore ?? null,
            aiRecommendation: meta?.aiRecommendation ?? null,
          }),
        });

        const data = (await res.json()) as { ok: boolean; error?: string };

        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? 'Action failed');
        }

        setReports((current) => current.filter((item) => item.id !== report.id));
        setAiByReportId((current) => {
          const next = { ...current };
          delete next[report.id];
          return next;
        });
      } catch (err) {
        console.error(err);
        alert('Action failed. Check console.');
      } finally {
        setActionPending(false);
      }
    },
    [aiByReportId],
  );

  return (
    <ModulePage
      title={config.label}
      description={config.description}
      icon={config.icon}
      loadedMessage="Report Review module loaded"
    >
      <div className="relative min-h-[12rem]">
        <LoadingOverlay
          active={showOverlay}
          label={
            actionPending
              ? 'Applying moderation action…'
              : loading
                ? 'Loading reports…'
                : 'Running AI analysis…'
          }
        />

        {error ? (
          <div
            className="card-enter flex items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 transition-all duration-500"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm font-semibold text-rose-200">Could not load reports</p>
              <p className="mt-1 text-sm text-rose-200/80">{error}</p>
            </div>
          </div>
        ) : null}

        {!loading && !error && reports.length === 0 ? (
          <p className="card-enter rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 text-center text-sm text-slate-500 transition-all duration-500">
            No items in the mod queue for r/{DEFAULT_SUBREDDIT}.
          </p>
        ) : null}

        <div className="space-y-4">
          {reports.map((report) => (
            <article
              key={report.id}
              className="card-enter rounded-2xl border border-slate-700/80 bg-slate-800/80 p-5 shadow-lg shadow-black/20 transition-all duration-500 sm:p-6"
            >
              <ReportAiRecommendation
                reportId={report.id}
                text={[report.title, report.body].filter(Boolean).join('\n')}
                onAnalysisChange={handleAnalysisChange}
              />

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {report.type === 't3' ? 'Post' : 'Comment'} · u/{report.author}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    {report.title ?? '[Comment]'}
                  </h3>
                </div>
                <a
                  href={report.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-300 hover:text-violet-200"
                >
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {report.body ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{report.body}</p>
              ) : null}

              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500">Reports</p>
                {report.reports.length > 0 ? (
                  <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-slate-300">
                    {report.reports.map((entry, idx) => (
                      <li key={`${report.id}-${idx}`}>
                        {entry[0]} — {entry[1]}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">No report reasons listed.</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleAction(report, 'approve')}
                  disabled={actionPending}
                  className="rounded bg-green-700 px-3 py-1 text-sm font-medium text-white transition-all duration-500 hover:bg-green-600 disabled:opacity-60"
                >
                  Allow
                </button>
                <button
                  type="button"
                  onClick={() => void handleAction(report, 'ignore_reports')}
                  disabled={actionPending}
                  className="rounded bg-yellow-700 px-3 py-1 text-sm font-medium text-white transition-all duration-500 hover:bg-yellow-600 disabled:opacity-60"
                >
                  Needs Context
                </button>
                <button
                  type="button"
                  onClick={() => void handleAction(report, 'spam')}
                  disabled={actionPending}
                  className="rounded bg-orange-700 px-3 py-1 text-sm font-medium text-white transition-all duration-500 hover:bg-orange-600 disabled:opacity-60"
                >
                  Spam
                </button>
                <button
                  type="button"
                  onClick={() => void handleAction(report, 'remove')}
                  disabled={actionPending}
                  className="rounded bg-red-700 px-3 py-1 text-sm font-medium text-white transition-all duration-500 hover:bg-red-600 disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </ModulePage>
  );
}

export default ReportReviewModule;
