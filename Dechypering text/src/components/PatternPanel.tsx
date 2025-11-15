import styles from "./PatternPanel.module.css";
import type { PatternMatches } from "../App";

interface Props {
  text: string;
  pattern: string;
  matches: PatternMatches;
  onClearPattern: () => void;
}

interface NeighborStat {
  letter: string;
  count: number;
  percent: number;
}

export const PatternPanel: React.FC<Props> = ({
  text,
  pattern,
  matches,
  onClearPattern,
}) => {
  const occurrences = matches.starts.length;

  const { beforeStats, afterStats } = computeNeighborStats(
    text,
    pattern,
    matches
  );

  return (
    <div className={styles.wrapper}>
      <h3>Pattern info</h3>

      <div className={styles.patternBlock}>
        <div className={styles.patternRow}>
          <span>Selected pattern:</span>
          <strong>{pattern ? `"${pattern}"` : "—"}</strong>
        </div>
        <div className={styles.patternRow}>
          <span>Occurrences in text:</span>
          <strong>{occurrences}</strong>
        </div>
        <p className={styles.hint}>
          Vzorec izbereš tako, da v Text preview z miško potegneš čez črke (kot
          da bi jih označil v brskalniku).
        </p>
        <button
          type="button"
          className={styles.clearButton}
          onClick={onClearPattern}
        >
          Clear selection
        </button>
      </div>

      <div className={styles.neighborBlock}>
        <h4>Most frequent previous letters</h4>
        {beforeStats.length === 0 ? (
          <p className={styles.empty}>No data.</p>
        ) : (
          <ul className={styles.list}>
            {beforeStats.map((n) => (
              <li key={n.letter}>
                <span className={styles.letter}>{n.letter}</span>
                <span className={styles.count}>{n.count}</span>
                <span className={styles.percent}>
                  {n.percent.toFixed(1).replace(".", ",")}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.neighborBlock}>
        <h4>Most frequent next letters</h4>
        {afterStats.length === 0 ? (
          <p className={styles.empty}>No data.</p>
        ) : (
          <ul className={styles.list}>
            {afterStats.map((n) => (
              <li key={n.letter}>
                <span className={styles.letter}>{n.letter}</span>
                <span className={styles.count}>{n.count}</span>
                <span className={styles.percent}>
                  {n.percent.toFixed(1).replace(".", ",")}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

function computeNeighborStats(
  text: string,
  pattern: string,
  matches: PatternMatches
): { beforeStats: NeighborStat[]; afterStats: NeighborStat[] } {
  if (!pattern || matches.starts.length === 0) {
    return { beforeStats: [], afterStats: [] };
  }

  const before: Record<string, number> = {};
  const after: Record<string, number> = {};
  const plen = pattern.length;
  const t = text.toLowerCase();

  for (const start of matches.starts) {
    const beforeIndex = start - 1;
    const afterIndex = start + plen;

    if (beforeIndex >= 0) {
      const ch = t[beforeIndex];
      if (ch && ch !== " ") {
        before[ch] = (before[ch] || 0) + 1;
      }
    }

    if (afterIndex < t.length) {
      const ch = t[afterIndex];
      if (ch && ch !== " ") {
        after[ch] = (after[ch] || 0) + 1;
      }
    }
  }

  const totalBefore = Object.values(before).reduce((a, b) => a + b, 0) || 1;
  const totalAfter = Object.values(after).reduce((a, b) => a + b, 0) || 1;

  const beforeStats: NeighborStat[] = Object.entries(before)
    .map(([letter, count]) => ({
      letter,
      count,
      percent: (count / totalBefore) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const afterStats: NeighborStat[] = Object.entries(after)
    .map(([letter, count]) => ({
      letter,
      count,
      percent: (count / totalAfter) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return { beforeStats, afterStats };
}
