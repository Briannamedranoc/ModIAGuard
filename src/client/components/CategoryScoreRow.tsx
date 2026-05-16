import { LevelBadge } from './LevelBadge';
import { ScoreBar } from './ScoreBar';
import { scoreToPercent } from '../utils/riskStyles';

type CategoryScoreRowProps = {
  label: string;
  score: number;
};

export function CategoryScoreRow({ label, score }: CategoryScoreRowProps) {
  return (
    <div className="card-enter rounded-xl border border-slate-800/80 bg-slate-900 p-6 shadow-md transition-all duration-500">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <div className="flex items-center gap-2">
          <LevelBadge score={score} />
          <span className="text-sm font-semibold tabular-nums text-slate-300">
            {scoreToPercent(score)}%
          </span>
        </div>
      </div>
      <ScoreBar score={score} />
    </div>
  );
}
