export type RiskLevel = 'low' | 'moderate' | 'high';

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

export function scoreToPercent(value: number): number {
  return Math.round(clampScore(value) * 100);
}

export function getRiskLevel(score: number): RiskLevel {
  const s = clampScore(score);
  if (s < 0.3) {
    return 'low';
  }
  if (s <= 0.6) {
    return 'moderate';
  }
  return 'high';
}

export function getLevelStyles(level: RiskLevel) {
  switch (level) {
    case 'low':
      return {
        badge:
          'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300',
        bar: 'bg-emerald-400',
        glow: 'shadow-[0_0_32px_-8px_rgba(52,211,153,0.35)]',
        ring: 'ring-emerald-500/20',
        label: 'Low risk',
        scoreText: 'text-emerald-300',
      };
    case 'moderate':
      return {
        badge:
          'rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300',
        bar: 'bg-amber-400',
        glow: 'shadow-[0_0_32px_-8px_rgba(251,191,36,0.35)]',
        ring: 'ring-amber-500/20',
        label: 'Moderate risk',
        scoreText: 'text-amber-300',
      };
    case 'high':
      return {
        badge:
          'rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-300',
        bar: 'bg-rose-400',
        glow: 'shadow-[0_0_32px_-8px_rgba(251,113,133,0.4)]',
        ring: 'ring-rose-500/20',
        label: 'High risk',
        scoreText: 'text-rose-300',
      };
  }
}

export function getBarWidthStyle(score: number): { width: string } {
  return { width: `${scoreToPercent(score)}%` };
}
