import { useState, useMemo } from "react";
import styles from "./LetterStats.module.css";

type Lang = "sl" | "en";

interface RefStat {
  letter: string;
  percent: number;
}

const SLO_DATA: RefStat[] = [
  { letter: "E", percent: 10.7 },
  { letter: "A", percent: 10.5 },
  { letter: "O", percent: 9.1 },
  { letter: "I", percent: 9.0 },
  { letter: "N", percent: 6.3 },
  { letter: "L", percent: 5.3 },
  { letter: "S", percent: 5.1 },
  { letter: "R", percent: 5.0 },
  { letter: "J", percent: 4.7 },
  { letter: "T", percent: 4.3 },
  { letter: "V", percent: 3.8 },
  { letter: "K", percent: 3.7 },
  { letter: "D", percent: 3.4 },
  { letter: "P", percent: 3.4 },
  { letter: "M", percent: 3.3 },
  { letter: "Z", percent: 2.1 },
  { letter: "B", percent: 2.0 },
  { letter: "U", percent: 1.9 },
  { letter: "G", percent: 1.6 },
  { letter: "Č", percent: 1.5 },
  { letter: "H", percent: 1.1 },
  { letter: "Š", percent: 1.0 },
  { letter: "C", percent: 0.7 },
  { letter: "Ž", percent: 0.7 },
  { letter: "F", percent: 0.1 },
];

const EN_DATA: RefStat[] = [
  { letter: "E", percent: 12.7 },
  { letter: "T", percent: 9.1 },
  { letter: "A", percent: 8.2 },
  { letter: "O", percent: 7.5 },
  { letter: "I", percent: 7.0 },
  { letter: "N", percent: 6.7 },
  { letter: "S", percent: 6.3 },
  { letter: "H", percent: 6.1 },
  { letter: "R", percent: 6.0 },
  { letter: "D", percent: 4.3 },
  { letter: "L", percent: 4.0 },
  { letter: "C", percent: 2.8 },
  { letter: "U", percent: 2.8 },
  { letter: "M", percent: 2.4 },
  { letter: "W", percent: 2.4 },
  { letter: "F", percent: 2.2 },
  { letter: "G", percent: 2.0 },
  { letter: "Y", percent: 2.0 },
  { letter: "P", percent: 1.9 },
  { letter: "B", percent: 1.5 },
  { letter: "V", percent: 1.0 },
  { letter: "K", percent: 0.8 },
  { letter: "J", percent: 0.15 },
  { letter: "X", percent: 0.15 },
  { letter: "Q", percent: 0.1 },
  { letter: "Z", percent: 0.07 },
];

interface Props {
  highlightPercent: number | null;
  hoverLetter: string | null;
  currentPercentMap: Record<string, number>;
}

export const ReferenceStats: React.FC<Props> = ({
  highlightPercent,
  hoverLetter,
}) => {
  const [lang, setLang] = useState<Lang>("sl");

  const data = lang === "sl" ? SLO_DATA : EN_DATA;
  const maxPercent = Math.max(...data.map((d) => d.percent));

  const closestIndex = useMemo(() => {
    if (highlightPercent == null) return null;
    let bestIdx = 0;
    let bestDiff = Infinity;
    data.forEach((d, idx) => {
      const diff = Math.abs(d.percent - highlightPercent);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [highlightPercent, data]);

  const ticks = buildPercentTicks(maxPercent);

  return (
    <>
      <div className={styles.refHeader}>
        <div className={styles.chartTitleRow}>
          <div className={styles.chartTitle}>Reference alphabet</div>
          <div className={styles.yLabel}>Frequency (%)</div>
        </div>
        <select
          className={styles.refSelect}
          value={lang}
          onChange={(e) => {
            setLang(e.target.value as Lang);
          }}
        >
          <option value="sl">Slovenian</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className={styles.chart}>
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
          {data.map((s, idx) => {
            const isClosest = closestIndex === idx && highlightPercent != null;
            const isSameLetter =
              hoverLetter &&
              hoverLetter.toUpperCase() === s.letter.toUpperCase();

            const classNames = [
              styles.column,
              isSameLetter ? styles.columnSameLetter : "",
              isClosest ? styles.columnMatch : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div key={s.letter} className={classNames}>
                <div className={styles.barWrapper}>
                  <div className={styles.value}>
                    <div>{s.percent.toFixed(1).replace(".", ",")}%</div>
                  </div>
                  <div
                    className={styles.bar}
                    style={{
                      height:
                        maxPercent > 0
                          ? `${(s.percent / maxPercent) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className={styles.letter}>{s.letter}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

function buildPercentTicks(max: number): number[] {
  const step = max > 20 ? 5 : 2;
  const ticks: number[] = [];
  for (let v = 0; v <= Math.ceil(max); v += step) {
    ticks.push(v);
  }
  return ticks;
}
