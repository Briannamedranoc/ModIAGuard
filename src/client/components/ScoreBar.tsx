import { getBarWidthStyle, getLevelStyles, getRiskLevel } from '../utils/riskStyles';

type ScoreBarProps = {
  score: number;
  className?: string;
};

export function ScoreBar({ score, className = '' }: ScoreBarProps) {
  const level = getRiskLevel(score);
  const styles = getLevelStyles(level);

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-700 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-500 ease-out ${styles.bar}`}
        style={getBarWidthStyle(score)}
      />
    </div>
  );
}
