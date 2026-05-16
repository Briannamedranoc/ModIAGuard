import { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { LoadingOverlay } from '../../client/components/LoadingOverlay';
import { ModulePage } from '../../client/components/ModulePage';
import { ScoreBar } from '../../client/components/ScoreBar';
import { DEFAULT_SUBREDDIT } from '../../client/config/constants';
import { NAV_ITEMS } from '../../client/config/navigation';
import { getLevelStyles, getRiskLevel, scoreToPercent } from '../../client/utils/riskStyles';
import { redditThingUrl } from '../../client/utils/redditLinks';

const config = NAV_ITEMS.find((item) => item.path === '/moderations-panel')!;

type ModerationAction = 'approve' | 'remove' | 'spam' | 'ignore_reports';

type ModerationEntry = {
  id: string;
  thingId: string;
  subreddit: string;
  moderator: string;
  action: ModerationAction;
  aiRecommendation?: 'remove' | 'approve' | 'needs_context' | 'spam';
  toxicityScore?: number;
  spamScore?: number;
  autoResponse?: string;
  createdAt: number;
  source: 'ReportReview' | 'AutoResponder' | 'AIEngine';
};

type ListSuccess = { ok: true; moderations: ModerationEntry[] };
type ApiFailure = { ok: false; error: string };

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString();
}

function moderatorLabel(moderator: string): string {
  const lower = moderator.trim().toLowerCase();
  if (lower === 'human') {
    return 'Human moderator';
  }
  if (lower === 'auto' || lower === 'ai') {
    return 'AI Auto';
  }
  return moderator;
}

function actionBadgeClass(action: ModerationAction): string {
  switch (action) {
    case 'approve':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'remove':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
    case 'spam':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
    case 'ignore_reports':
      return 'border-slate-600/50 bg-slate-800/80 text-slate-300';
  }
}

function actionLabel(action: ModerationAction): string {
  switch (action) {
    case 'approve':
      return 'Approve';
    case 'remove':
      return 'Remove';
    case 'spam':
      return 'Spam';
    case 'ignore_reports':
      return 'Needs context';
  }
}

function sourceBadgeClass(source: ModerationEntry['source']): string {
  switch (source) {
    case 'ReportReview':
      return 'border-violet-500/30 bg-violet-500/10 text-violet-300';
    case 'AutoResponder':
      return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
    case 'AIEngine':
      return 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200';
  }
}

function aiRecommendationLabel(
  recommendation: NonNullable<ModerationEntry['aiRecommendation']>,
): string {
  switch (recommendation) {
    case 'approve':
      return 'AI: Approve';
    case 'needs_context':
      return 'AI: Needs context';
    case 'spam':
      return 'AI: Spam';
    case 'remove':
      return 'AI: Remove';
  }
}

function aiRecommendationBadgeClass(
  recommendation: NonNullable<ModerationEntry['aiRecommendation']>,
): string {
  switch (recommendation) {
    case 'approve':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'needs_context':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    case 'spam':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
    case 'remove':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
  }
}

function ModerationCard({ entry }: { entry: ModerationEntry }) {
  const redditUrl = redditThingUrl(entry.thingId, entry.subreddit);

  return (
    <article className="card-enter rounded-xl border border-slate-800/80 bg-slate-900 p-6 shadow-md transition-all duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${actionBadgeClass(entry.action)}`}
          >
            {actionLabel(entry.action)}
          </span>
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${sourceBadgeClass(entry.source)}`}
          >
            {entry.source}
          </span>
        </div>
        <time className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</time>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">Moderator</dt>
          <dd className="font-medium text-slate-200">{moderatorLabel(entry.moderator)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Subreddit</dt>
          <dd className="text-slate-200">r/{entry.subreddit}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-slate-500">Thing ID</dt>
          <dd>
            <a
              href={redditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-sm text-violet-300 hover:text-violet-200"
            >
              {entry.thingId}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </dd>
        </div>
      </dl>

      {entry.aiRecommendation ? (
        <div className="mt-4 border-t border-slate-800/80 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            AI recommendation
          </p>
          <span
            className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${aiRecommendationBadgeClass(entry.aiRecommendation)}`}
          >
            {aiRecommendationLabel(entry.aiRecommendation)}
          </span>
        </div>
      ) : null}

      {entry.toxicityScore != null || entry.spamScore != null ? (
        <div className="mt-4 space-y-4 border-t border-slate-800/80 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">AI scores</p>
          {entry.toxicityScore != null ? (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-400">
                <span>Toxicity</span>
                <span
                  className={`font-semibold tabular-nums ${getLevelStyles(getRiskLevel(entry.toxicityScore)).scoreText}`}
                >
                  {scoreToPercent(entry.toxicityScore)}%
                </span>
              </div>
              <ScoreBar score={entry.toxicityScore} />
            </div>
          ) : null}
          {entry.spamScore != null ? (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-400">
                <span>Spam</span>
                <span
                  className={`font-semibold tabular-nums ${getLevelStyles(getRiskLevel(entry.spamScore)).scoreText}`}
                >
                  {scoreToPercent(entry.spamScore)}%
                </span>
              </div>
              <ScoreBar score={entry.spamScore} />
            </div>
          ) : null}
        </div>
      ) : null}

      {entry.autoResponse ? (
        <div className="mt-4 border-t border-slate-800/80 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Auto-response
          </p>
          <p className="mt-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm leading-relaxed text-slate-300">
            {entry.autoResponse}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function ModerationsPanelModule() {
  const [loading, setLoading] = useState(true);
  const [moderations, setModerations] = useState<ModerationEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/moderations/list?subreddit=${encodeURIComponent(DEFAULT_SUBREDDIT)}`,
        );
        const data = (await res.json()) as ListSuccess | ApiFailure;

        if (!res.ok || !data.ok) {
          throw new Error(!data.ok ? data.error : `Request failed (${res.status})`);
        }

        setModerations(data.moderations);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load moderations';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <ModulePage
      title="Moderations Panel"
      description={config.description}
      icon={config.icon}
      loadedMessage="Moderations loaded"
    >
      <div className="relative min-h-[12rem]">
        <LoadingOverlay active={loading} label="Loading moderation activity…" />

        {error ? (
          <div
            className="card-enter flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 transition-all duration-500"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <p className="text-sm text-rose-200/90">{error}</p>
          </div>
        ) : null}

        {!loading && !error && moderations.length === 0 ? (
          <p className="card-enter rounded-xl border border-slate-800/80 bg-slate-900/60 p-8 text-center text-sm text-slate-500 shadow-md transition-all duration-500">
            No moderation actions recorded yet. Actions from Report Review will appear here.
          </p>
        ) : null}

        <div className="space-y-4">
          {moderations.map((entry) => (
            <ModerationCard key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </ModulePage>
  );
}

export default ModerationsPanelModule;
