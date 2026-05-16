import { useCallback, useState } from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { LevelBadge } from '../../client/components/LevelBadge';
import { LoadingOverlay } from '../../client/components/LoadingOverlay';
import { ModulePage } from '../../client/components/ModulePage';
import { ScoreBar } from '../../client/components/ScoreBar';
import { NAV_ITEMS } from '../../client/config/navigation';
import { scoreToPercent } from '../../client/utils/riskStyles';

const config = NAV_ITEMS.find((item) => item.path === '/moderator-recommendations')!;

type AIRecommendation = 'remove' | 'approve' | 'needs_context' | 'spam';

type AnalysisResult = {
  toxicityScore: number;
  spamScore: number;
  recommendation: AIRecommendation;
};

function recommendationMeta(recommendation: AIRecommendation) {
  switch (recommendation) {
    case 'remove':
      return {
        label: 'REMOVE',
        hint: 'Critical risk — remove or escalate immediately.',
        badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
        bar: 'bg-rose-400',
        ring: 'ring-rose-500/20',
      };
    case 'spam':
      return {
        label: 'SPAM',
        hint: 'Strong spam signals detected.',
        badge: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
        bar: 'bg-orange-400',
        ring: 'ring-orange-500/20',
      };
    case 'needs_context':
      return {
        label: 'NEEDS CONTEXT',
        hint: 'Review manually before taking action.',
        badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        bar: 'bg-amber-400',
        ring: 'ring-amber-500/20',
      };
    case 'approve':
      return {
        label: 'APPROVE',
        hint: 'Low risk — safe to allow.',
        badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        bar: 'bg-emerald-400',
        ring: 'ring-emerald-500/20',
      };
  }
}

export function ModeratorRecommendationsModule() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const generate = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please enter post or comment text.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const [toxicityRes, spamRes] = await Promise.all([
        fetch('/api/toxicity/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        }),
        fetch('/api/spam/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        }),
      ]);

      const toxicityData = (await toxicityRes.json()) as {
        ok: boolean;
        data?: { analysis: { toxicityScore: number } };
        error?: string;
      };
      const spamData = (await spamRes.json()) as {
        ok: boolean;
        data?: { analysis: { spamScore: number } };
        error?: string;
      };

      if (!toxicityRes.ok || !toxicityData.ok || !toxicityData.data?.analysis) {
        throw new Error(toxicityData.error ?? 'Toxicity analysis failed');
      }
      if (!spamRes.ok || !spamData.ok || !spamData.data?.analysis) {
        throw new Error(spamData.error ?? 'Spam analysis failed');
      }

      const recommendRes = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toxicity: toxicityData.data.analysis.toxicityScore,
          spam: spamData.data.analysis.spamScore,
        }),
      });

      const recommendData = (await recommendRes.json()) as {
        ok: boolean;
        data?: { recommendation: AIRecommendation };
        error?: string;
      };

      if (!recommendRes.ok || !recommendData.ok || !recommendData.data) {
        throw new Error(recommendData.error ?? 'Recommendation failed');
      }

      setResult({
        toxicityScore: toxicityData.data.analysis.toxicityScore,
        spamScore: spamData.data.analysis.spamScore,
        recommendation: recommendData.data.recommendation,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [text]);

  const meta = result ? recommendationMeta(result.recommendation) : null;

  return (
    <ModulePage
      title={config.label}
      description={config.description}
      icon={config.icon}
      loadedMessage="Ready to recommend"
    >
      <div className="relative min-h-[12rem]">
        <LoadingOverlay active={loading} label="Generating recommendation…" />

        <div className="flex flex-col gap-6">
          <article className="card-enter rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-md transition-all duration-500 sm:p-8">
            <label htmlFor="mod-rec-text" className="text-sm font-semibold text-slate-200">
              Content to evaluate
            </label>
            <p className="mt-1 text-sm text-slate-500">
              We analyze toxicity and spam, then suggest a moderation action.
            </p>
            <textarea
              id="mod-rec-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              disabled={loading}
              placeholder="Paste post or comment text…"
              className="mt-4 w-full resize-y rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-sm leading-relaxed text-slate-100 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void generate()}
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-500 hover:bg-violet-500 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Recommendation
                </>
              )}
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

          {result && meta ? (
            <article
              className={`card-enter animate-in fade-in slide-in-from-bottom rounded-xl border border-slate-800/80 bg-gradient-to-br from-slate-900/95 via-slate-900/70 to-slate-950/95 p-6 shadow-md ring-1 transition-all duration-500 ${meta.ring} sm:p-8`}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Recommended action
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-bold ${meta.badge}`}
                >
                  {meta.label}
                </span>
                <span className="text-sm text-slate-400">{meta.hint}</span>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-500">Toxicity</p>
                    <LevelBadge score={result.toxicityScore} />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-slate-200">
                    {scoreToPercent(result.toxicityScore)}%
                  </p>
                  <ScoreBar score={result.toxicityScore} className="mt-3" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-500">Spam</p>
                    <LevelBadge score={result.spamScore} />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-slate-200">
                    {scoreToPercent(result.spamScore)}%
                  </p>
                  <ScoreBar score={result.spamScore} className="mt-3" />
                </div>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-slate-400">
                Rules: remove if toxicity or spam &gt; 60%; spam action if spam &gt; 40%; needs
                context if toxicity &gt; 30%; otherwise approve.
              </p>
            </article>
          ) : null}
        </div>
      </div>
    </ModulePage>
  );
}

export default ModeratorRecommendationsModule;
