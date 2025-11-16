import { useEffect, useState } from "react";
import styles from "./PatternPanel.module.css";
import type { PatternMatches } from "../../../state/cipherTypes";

interface Props {
  text: string;
  pattern: string;
  matches: PatternMatches;
  onClearPattern: () => void;
  onAddSuspected: (word: string) => void;
  onPatternChange: (pattern: string) => void;
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
  onAddSuspected,
  onPatternChange,
}) => {
  const occurrences = matches.starts.length;

  const { beforeStats, afterStats } = computeNeighborStats(
    text,
    pattern,
    matches
  );

  const [inputValue, setInputValue] = useState(pattern);

  // sync input when user selects pattern with mouse
  useEffect(() => {
    setInputValue(pattern);
  }, [pattern]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onPatternChange(value);
  };

  const handleAddSuspectedClick = () => {
    if (!inputValue.trim()) return;
    onAddSuspected(inputValue.trim());
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h3>Pattern info</h3>
        <button
          type="button"
          className={styles.Button}
          onClick={onClearPattern}
        >
          Clear selection
        </button>
      </div>

      <div className={styles.patternBlock}>
        <label className={styles.patternInputLabel}>
          Search / pattern:
          <input
            className={styles.patternInput}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type pattern or use selection in text…"
          />
        </label>

        <div className={styles.patternRow}>
          <span>Selected pattern:</span>
          <strong>{inputValue ? `"${inputValue}"` : "—"}</strong>
        </div>
        <div className={styles.patternRow}>
          <span>Occurrences in text:</span>
          <strong>{occurrences}</strong>
        </div>
        <p className={styles.hint}>
          You can select a pattern by dragging over letters in Text preview or
          by typing it above. Use '_' as wildcard.
        </p>

        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddSuspectedClick}
          disabled={!inputValue.trim()}
        >
          Add to suspected words
        </button>
      </div>

      {/* Previous letters */}
      <div className={styles.neighborBlock}>
        <h4>Most frequent previous letters</h4>
        {beforeStats.length === 0 ? (
          <p className={styles.empty}>No data.</p>
        ) : (
          <ul className={styles.list}>
            {beforeStats.map((n) => (
              <li key={n.letter} className={styles.listItem}>
                <span className={styles.letter}>{n.letter}</span>
                <span className={styles.count}>{n.count}×</span>
                <span className={styles.percent}>
                  {n.percent.toFixed(1).replace(".", ",")}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Next letters */}
      <div className={styles.neighborBlock}>
        <h4>Most frequent next letters</h4>
        {afterStats.length === 0 ? (
          <p className={styles.empty}>No data.</p>
        ) : (
          <ul className={styles.list}>
            {afterStats.map((n) => (
              <li key={n.letter} className={styles.listItem}>
                <span className={styles.letter}>{n.letter}</span>
                <span className={styles.count}>{n.count}×</span>
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

// computeNeighborStats stays the same as before
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
