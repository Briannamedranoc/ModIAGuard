import { getLevelStyles, getRiskLevel, scoreToPercent } from '../utils/riskStyles';

export type LogEntryView = {
  id: string;
  ts: number;
  moderator: string;
  action: string;
  thingId: string;
  subreddit: string;
  source: string;
  toxicityScore?: number | null;
  spamScore?: number | null;
  aiRecommendation?: 'remove' | 'approve' | 'needs_context' | 'spam';
  autoResponse?: string | null;
  auto?: boolean;
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString();
}

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

function actionLabel(action: string): string {
  switch (action) {
    case 'approve':
      return 'Approve';
    case 'remove':
      return 'Remove';
    case 'spam':
      return 'Spam';
    case 'ignore_reports':
      return 'Needs context';
    default:
      return action;
  }
}

function aiRecommendationBadgeClass(
  recommendation: NonNullable<LogEntryView['aiRecommendation']>,
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

function aiRecommendationLabel(
  recommendation: NonNullable<LogEntryView['aiRecommendation']>,
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

export function LogEntryCard({ log }: { log: LogEntryView }) {
  return (
    <article className="card-enter rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-md transition-all duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${actionBadgeClass(log.action)}`}
          >
            {actionLabel(log.action)}
          </span>
          {log.auto ? (
            <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-xs font-medium text-fuchsia-300">
              Auto
            </span>
          ) : null}
        </div>
        <time className="text-xs text-slate-500">{formatTime(log.ts)}</time>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">Thing ID</dt>
          <dd className="font-mono text-slate-200">{log.thingId}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Subreddit</dt>
          <dd className="text-slate-200">r/{log.subreddit}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Moderator</dt>
          <dd className="text-slate-200">{log.moderator}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Source</dt>
          <dd className="text-slate-200">{log.source}</dd>
        </div>
      </dl>

      {log.toxicityScore != null ||
      log.spamScore != null ||
      log.aiRecommendation ||
      log.autoResponse ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          {log.toxicityScore != null ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getLevelStyles(getRiskLevel(log.toxicityScore)).badge}`}
            >
              Toxicity {scoreToPercent(log.toxicityScore)}%
            </span>
          ) : null}
          {log.spamScore != null ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getLevelStyles(getRiskLevel(log.spamScore)).badge}`}
            >
              Spam {scoreToPercent(log.spamScore)}%
            </span>
          ) : null}
          {log.aiRecommendation ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${aiRecommendationBadgeClass(log.aiRecommendation)}`}
            >
              {aiRecommendationLabel(log.aiRecommendation)}
            </span>
          ) : null}
          {log.autoResponse ? (
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-200">
              Auto-response queued
            </span>
          ) : null}
        </div>
      ) : null}

      {log.autoResponse ? (
        <p className="mt-3 rounded-lg border border-slate-800/80 bg-slate-950/50 p-3 text-sm text-slate-300">
          {log.autoResponse}
        </p>
      ) : null}
    </article>
  );
}
