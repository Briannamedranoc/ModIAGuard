import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { LevelBadge } from '../../client/components/LevelBadge';
import { ScoreBar } from '../../client/components/ScoreBar';
import { scoreToPercent } from '../../client/utils/riskStyles';
import type { AIRecommendation, ReportAiAnalysis } from './types';

type RecommendSuccess = { ok: true; data: { recommendation: AIRecommendation } };

function recommendationMeta(recommendation: AIRecommendation) {
  switch (recommendation) {
    case 'remove':
      return {
        label: 'REMOVE',
        hint: 'critical risk',
        className: 'border-rose-500/40 bg-rose-500/15 text-rose-200',
      };
    case 'spam':
      return {
        label: 'SPAM',
        hint: 'high spam signals',
        className: 'border-orange-500/40 bg-orange-500/15 text-orange-200',
      };
    case 'needs_context':
      return {
        label: 'NEEDS CONTEXT',
        hint: 'review recommended',
        className: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
      };
    case 'approve':
      return {
        label: 'APPROVE',
        hint: 'low risk',
        className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
      };
  }
}

const EMPTY_ANALYSIS: ReportAiAnalysis = {
  toxicityScore: null,
  spamScore: null,
  aiRecommendation: null,
  loading: false,
};

type ReportAiRecommendationProps = {
  reportId: string;
  text: string;
  onAnalysisChange: (reportId: string, analysis: ReportAiAnalysis) => void;
};

export function ReportAiRecommendation({
  reportId,
  text,
  onAnalysisChange,
}: ReportAiRecommendationProps) {
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [toxicityScore, setToxicityScore] = useState<number | null>(null);
  const [spamScore, setSpamScore] = useState<number | null>(null);

  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      setLoading(false);
      setRecommendation(null);
      setToxicityScore(null);
      setSpamScore(null);
      onAnalysisChange(reportId, { ...EMPTY_ANALYSIS, loading: false });
      return;
    }

    setLoading(true);
    onAnalysisChange(reportId, { ...EMPTY_ANALYSIS, loading: true });

    async function load() {
      let nextToxicity: number | null = null;
      let nextSpam: number | null = null;
      let nextRecommendation: AIRecommendation | null = null;

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
        };
        const spamData = (await spamRes.json()) as {
          ok: boolean;
          data?: { analysis: { spamScore: number } };
        };

        if (toxicityData.ok && toxicityData.data?.analysis) {
          nextToxicity = toxicityData.data.analysis.toxicityScore;
        }
        if (spamData.ok && spamData.data?.analysis) {
          nextSpam = spamData.data.analysis.spamScore;
        }

        if (nextToxicity != null && nextSpam != null) {
          const recommendRes = await fetch('/api/ai/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toxicity: nextToxicity,
              spam: nextSpam,
            }),
          });

          const recommendData = (await recommendRes.json()) as RecommendSuccess | { ok: false };
        if (recommendData.ok) {
          nextRecommendation = recommendData.data.recommendation;
        }
        }

        setToxicityScore(nextToxicity);
        setSpamScore(nextSpam);
        setRecommendation(nextRecommendation);
      } catch {
        nextToxicity = null;
        nextSpam = null;
        nextRecommendation = null;
        setToxicityScore(null);
        setSpamScore(null);
        setRecommendation(null);
      } finally {
        setLoading(false);
        onAnalysisChange(reportId, {
          toxicityScore: nextToxicity,
          spamScore: nextSpam,
          aiRecommendation: nextRecommendation,
          loading: false,
        });
      }
    }

    void load();
  }, [text, reportId, onAnalysisChange]);

  if (!text.trim()) {
    return null;
  }

  if (loading) {
    return (
      <div className="card-enter mb-4 flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-slate-400 transition-all duration-500">
        <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
        AI analyzing content…
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  const meta = recommendationMeta(recommendation);

  return (
    <div
      className={`card-enter mb-4 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 transition-all duration-500 ${meta.className}`}
    >
      <Sparkles className="h-4 w-4 shrink-0 opacity-80" />
      <span className="text-xs font-medium uppercase tracking-wider opacity-80">AI Recommendation</span>
      <span className="rounded-full bg-black/20 px-2 py-0.5 text-sm font-bold">{meta.label}</span>
      <span className="text-xs opacity-75">({meta.hint})</span>
      {toxicityScore != null || spamScore != null ? (
        <div className="mt-3 w-full space-y-3 border-t border-current/10 pt-3">
          {toxicityScore != null ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="opacity-80">Toxicity</span>
                <LevelBadge score={toxicityScore} />
                <span className="tabular-nums opacity-80">{scoreToPercent(toxicityScore)}%</span>
              </div>
              <ScoreBar score={toxicityScore} />
            </div>
          ) : null}
          {spamScore != null ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="opacity-80">Spam</span>
                <LevelBadge score={spamScore} />
                <span className="tabular-nums opacity-80">{scoreToPercent(spamScore)}%</span>
              </div>
              <ScoreBar score={spamScore} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
