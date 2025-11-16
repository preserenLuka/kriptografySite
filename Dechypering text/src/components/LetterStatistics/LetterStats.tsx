import { useState } from "react";
import styles from "./LetterStats.module.css";
import { ReferenceStats } from "./ReferenceStats";

interface Props {
  text: string;
  alphabet: string[];
  onHoverLetter?: (letter: string | null) => void;
}

interface Stat {
  letter: string;
  count: number;
  percent: number;
}

export const LetterStats: React.FC<Props> = ({
  text,
  alphabet,
  onHoverLetter,
}) => {
  const { stats, total, maxCount, percentMap } = computeStats(text, alphabet);
  const ticks = buildTicks(maxCount);

  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);
  const [hoveredPercent, setHoveredPercent] = useState<number | null>(null);

  const handleHover = (letter: string | null, percent?: number) => {
    setHoveredLetter(letter);
    setHoveredPercent(percent ?? null);
    onHoverLetter?.(letter);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Letter statistics</h3>
        <span className={styles.total}>Total letters: {total}</span>
      </div>

      <div className={styles.chartsRow}>
        {/* LEFT: current text */}
        <div className={styles.chartWrapper}>
          <div className={styles.chartTitleRow}>
            <div className={styles.chartTitle}>Current text</div>
            <div className={styles.yLabel}>Count (occurrences)</div>
          </div>
          <div className={styles.chart} onMouseLeave={() => handleHover(null)}>
            <div className={styles.yAxis}>
              <div className={styles.yAxisInner}>
                {ticks.map((v) => (
                  <div key={v} className={styles.yTick}>
                    {v}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.bars}>
              {stats.map((s) => {
                const isHovered =
                  hoveredLetter !== null &&
                  hoveredLetter.toLowerCase() === s.letter.toLowerCase();

                return (
                  <div
                    key={s.letter}
                    className={styles.column}
                    onMouseEnter={() => handleHover(s.letter, s.percent)}
                  >
                    <div className={styles.barWrapper}>
                      <div className={styles.value}>
                        {s.percent.toFixed(1).replace(".", ",")}%
                      </div>
                      <div
                        className={`${styles.bar} ${
                          isHovered ? styles.barActive : ""
                        }`}
                        style={{
                          height:
                            maxCount > 0
                              ? `${(s.count / maxCount) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className={styles.letter}>
                      {s.letter.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: reference alphabet */}
        <div className={styles.chartWrapper}>
          <ReferenceStats
            highlightPercent={hoveredPercent}
            hoverLetter={hoveredLetter}
            currentPercentMap={percentMap}
          />
        </div>
      </div>
    </div>
  );
};

function computeStats(
  text: string,
  alphabet: string[]
): {
  stats: Stat[];
  total: number;
  maxCount: number;
  percentMap: Record<string, number>;
} {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const ch of text.toLowerCase()) {
    if (alphabet.includes(ch)) {
      counts[ch] = (counts[ch] || 0) + 1;
      total++;
    }
  }

  const percentMap: Record<string, number> = {};

  const stats: Stat[] = Object.entries(counts).map(([letter, count]) => {
    const percent = total ? (count / total) * 100 : 0;
    percentMap[letter] = percent;
    return { letter, count, percent };
  });

  stats.sort((a, b) => b.count - a.count);
  const maxCount = stats.length ? stats[0].count : 0;

  return { stats, total, maxCount, percentMap };
}

function buildTicks(maxCount: number): number[] {
  if (maxCount === 0) return [0];

  const step = getTickStep(maxCount);
  const ticks: number[] = [];
  for (let v = 0; v <= maxCount; v += step) {
    ticks.push(v);
  }
  return ticks;
}

function getTickStep(maxCount: number): number {
  if (maxCount <= 10) return 1;
  if (maxCount <= 20) return 2;
  if (maxCount <= 50) return 5;
  if (maxCount <= 100) return 10;
  if (maxCount <= 200) return 20;
  return Math.ceil(maxCount / 10);
}
