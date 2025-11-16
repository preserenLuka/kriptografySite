import styles from "./SuspectedWords.module.css";
import type { Mapping } from "../App";

interface Props {
  words: string[];
  mapping: Mapping;
  onRemoveWord: (word: string) => void;
  colors: string[]; // same length as words
}

export const SuspectedWords: React.FC<Props> = ({
  words,
  mapping,
  onRemoveWord,
  colors,
}) => {
  if (!words.length) {
    return (
      <div className={styles.wrapper}>
        <h3>Suspected words</h3>
        <p className={styles.empty}>
          No words added yet. Use “Add to suspected” in Pattern info.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h3>Suspected words</h3>
      <div className={styles.list}>
        {words.map((w, idx) => {
          const color = colors[idx];

          return (
            <div key={w} className={styles.wordBlock}>
              <div className={styles.wordHeader}>
                <div className={styles.leftHeader}>
                  <span
                    className={styles.colorDot}
                    style={{ backgroundColor: color }}
                  />
                  <span className={styles.wordLabel}>Cipher text</span>
                </div>
                <span className={styles.wordValue}>{w}</span>
              </div>

              <div className={styles.grid}>
                {w.split("").map((ch, i) => {
                  const lower = ch.toLowerCase();
                  const mapped = mapping[lower];
                  const hasMapping = mapped && mapped.length === 1;
                  const displayChar = hasMapping ? mapped : ch;
                  const title = hasMapping ? `${ch} → ${mapped}` : ch;
                  const className =
                    styles.box + (hasMapping ? " " + styles.boxMapped : "");

                  return (
                    <div key={i} className={className} title={title}>
                      {displayChar}
                    </div>
                  );
                })}
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => onRemoveWord(w)}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
