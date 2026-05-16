import { useCallback, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { CategoryScoreRow } from '../../client/components/CategoryScoreRow';
import { LevelBadge } from '../../client/components/LevelBadge';
import { LoadingOverlay } from '../../client/components/LoadingOverlay';
import { ModulePage } from '../../client/components/ModulePage';
import { ScoreBar } from '../../client/components/ScoreBar';
import { NAV_ITEMS } from '../../client/config/navigation';
import {
  getLevelStyles,
  getRiskLevel,
  scoreToPercent,
} from '../../client/utils/riskStyles';

const config = NAV_ITEMS.find((item) => item.path === '/toxicity-analyzer')!;

type ToxicityCategories = {
  insult: number;
  threat: number;
  hate: number;
};

type ToxicityAnalysis = {
  toxicityScore: number;
  categories: ToxicityCategories;
};

type AnalyzeSuccess = { ok: true; data: { analysis: ToxicityAnalysis } };
type AnalyzeFailure = { ok: false; error: string };

const CATEGORY_META: { key: keyof ToxicityCategories; label: string }[] = [
  { key: 'insult', label: 'Insult' },
  { key: 'threat', label: 'Threat' },
  { key: 'hate', label: 'Hate' },
];

function SummaryCard({
  analysis,
  icon: Icon,
}: {
  analysis: ToxicityAnalysis;
  icon: LucideIcon;
}) {
  const level = getRiskLevel(analysis.toxicityScore);
  const styles = getLevelStyles(level);
  const percent = scoreToPercent(analysis.toxicityScore);
  const highest = CATEGORY_META.reduce(
    (best, cat) => {
      const value = analysis.categories[cat.key];
      return value > best.value ? { label: cat.label, value } : best;
    },
    { label: 'None', value: 0 },
  );

  return (
    <article
      className={`card-enter rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/95 via-slate-900/70 to-slate-950/95 p-6 shadow-xl shadow-black/25 ring-1 transition-all duration-500 ${styles.ring} ${styles.glow} sm:p-8`}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${styles.badge}`}
          >
            <Icon className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Analysis summary
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white">Toxicity overview</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              Overall score is <span className="font-medium text-slate-200">{percent}%</span>.
              {highest.value > 0 ? (
                <>
                  {' '}
                  Strongest signal:{' '}
                  <span className="font-medium text-slate-200">{highest.label}</span> (
                  {scoreToPercent(highest.value)}%).
                </>
              ) : (
                ' No category signals detected.'
              )}
            </p>
          </div>
        </div>
        <LevelBadge score={analysis.toxicityScore} />
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <p className="text-sm font-medium text-slate-400">Overall toxicity</p>
          <p className={`text-4xl font-bold tabular-nums tracking-tight ${styles.scoreText}`}>
            {percent}%
          </p>
        </div>
        <ScoreBar score={analysis.toxicityScore} className="mt-4" />
      </div>
    </article>
  );
}

export function ToxicityAnalyzerModule() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ToxicityAnalysis | null>(null);

  const analyze = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please enter some text to analyze.');
      setAnalysis(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/toxicity/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      const payload = (await response.json()) as AnalyzeSuccess | AnalyzeFailure;

      if (!response.ok || !payload.ok) {
        const message =
          !payload.ok && payload.error
            ? payload.error
            : `Analysis failed (${response.status})`;
        setError(message);
        setAnalysis(null);
        return;
      }

      setAnalysis(payload.data.analysis);
    } catch {
      setError('Could not reach the toxicity API. Try again in a moment.');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [text]);

  return (
    <ModulePage
      title={config.label}
      description={config.description}
      icon={config.icon}
      loadedMessage="Ready to analyze"
    >
      <div className="relative min-h-[12rem]">
        <LoadingOverlay active={loading} label="Running toxicity analysis…" />
        <div className="flex flex-col gap-6">
        <article className="card-enter rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-lg shadow-black/20 transition-all duration-500 sm:p-8">
          <label htmlFor="toxicity-input" className="text-sm font-semibold text-slate-200">
            Text to analyze
          </label>
          <p className="mt-1 text-sm text-slate-500">
            Paste a comment, post, or message. Results use insult, threat, and hate categories.
          </p>
          <textarea
            id="toxicity-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Paste text here to scan for toxic language…"
            disabled={loading}
            className="mt-4 w-full resize-y rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void analyze()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Analyze Toxicity
                </>
              )}
            </button>
            {text.trim().length > 0 ? (
              <span className="text-xs text-slate-500">{text.trim().length} characters</span>
            ) : null}
          </div>
        </article>

        {error ? (
          <div
            className="card-enter flex items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 transition-all duration-500"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm font-semibold text-rose-200">Analysis failed</p>
              <p className="mt-1 text-sm text-rose-200/80">{error}</p>
            </div>
          </div>
        ) : null}

        {analysis && !loading ? (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom">
            <SummaryCard analysis={analysis} icon={ShieldAlert} />

            <article className="card-enter rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 shadow-xl shadow-black/25 transition-all duration-500 sm:p-8">
              <div className="border-b border-slate-800/80 pb-4">
                <h3 className="text-sm font-semibold text-slate-200">Category breakdown</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Scores per signal type. Green &lt; 30%, yellow 30–60%, red &gt; 60%.
                </p>
              </div>
              <div className="mt-6 grid gap-4">
                {CATEGORY_META.map((cat) => (
                  <CategoryScoreRow
                    key={cat.key}
                    label={cat.label}
                    score={analysis.categories[cat.key]}
                  />
                ))}
              </div>
            </article>
          </div>
        ) : null}
        </div>
      </div>
    </ModulePage>
  );
}

export default ToxicityAnalyzerModule;
