import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, LayoutGrid } from 'lucide-react';

type PlaceholderStat = {
  label: string;
  hint: string;
};

type ModulePageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  loadedMessage?: string;
  stats?: PlaceholderStat[];
  children?: ReactNode;
};

const DEFAULT_STATS: PlaceholderStat[] = [
  { label: 'Queue', hint: 'Items pending review' },
  { label: 'Confidence', hint: 'Model certainty' },
  { label: 'Last run', hint: 'Most recent scan' },
];

export function ModulePage({
  title,
  description,
  icon: Icon,
  loadedMessage,
  stats = DEFAULT_STATS,
  children,
}: ModulePageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300 shadow-[0_0_24px_-8px_rgba(139,92,246,0.45)]">
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-violet-600 dark:text-violet-100">
              {title}
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--app-text-muted)]">
              {description}
            </p>
          </div>
        </div>
        {loadedMessage ? (
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {loadedMessage}
          </span>
        ) : null}
      </header>

      {children ? (
        children
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="group rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg shadow-black/20 transition hover:border-slate-700 hover:bg-slate-900/80"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-600">—</p>
                <p className="mt-2 text-sm text-slate-500">{stat.hint}</p>
              </article>
            ))}
          </div>

          <article className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 shadow-xl shadow-black/25 sm:p-8">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <LayoutGrid className="h-5 w-5 text-violet-400" strokeWidth={1.75} />
              <h3 className="text-sm font-semibold text-slate-200">Workspace preview</h3>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((slot) => (
                <div
                  key={slot}
                  className="h-24 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/50"
                />
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-slate-500">
              UI shell ready — connect analysis logic in a later step.
            </p>
          </article>
        </>
      )}
    </div>
  );
}
