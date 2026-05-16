import { getLevelStyles, getRiskLevel } from '../utils/riskStyles';

export function LevelBadge({ score }: { score: number }) {
  const styles = getLevelStyles(getRiskLevel(score));
  return <span className={styles.badge}>{styles.label}</span>;
}
