import { useEffect, useState } from "react";
import styles from "./TextGrid.module.css";
import type { Mapping } from "../App";

interface Props {
  text: string;
  mapping: Mapping;
  hoveredLetter: string | null;
  selectMode: boolean;
  onToggleSelectMode: () => void;
  showNgrams: boolean;
  onToggleNgrams: () => void;
  pattern: string;
  onPatternChange: (pattern: string) => void;
  patternMatchIndices: Set<number>;
}

// določi layout glede na dolžino teksta
function getLayout(length: number) {
  // številke lahko po občutku še malo spremeniš
  if (length <= 150) {
    // malo teksta → večji kvadratki, manj stolpcev
    return {
      charsPerRow: Math.min(25, Math.max(10, length)),
      boxSize: 36,
      fontSize: 16,
    };
  }

  if (length <= 700) {
    // srednje dolg tekst
    return {
      charsPerRow: 40,
      boxSize: 30,
      fontSize: 14,
    };
  }

  // zelo dolg tekst
  return {
    charsPerRow: 50,
    boxSize: 26,
    fontSize: 13,
  };
}

export const TextGrid: React.FC<Props> = ({
  text,
  mapping,
  hoveredLetter,
  selectMode,
  onToggleSelectMode,
  showNgrams,
  onToggleNgrams,
  pattern,
  onPatternChange,
  patternMatchIndices,
}) => {
  const { charsPerRow, boxSize, fontSize } = getLayout(text.length);

  // razbij tekst na vrstice po charsPerRow
  const rows: string[] = [];
  for (let i = 0; i < text.length; i += charsPerRow) {
    rows.push(text.slice(i, i + charsPerRow));
  }

  const [isSelecting, setIsSelecting] = useState(false);
  const [startIndex, setStartIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleUp = () => {
      setIsSelecting(false);
      setStartIndex(null);
    };
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, []);

  const beginSelection = (index: number) => {
    if (!selectMode) return;
    setIsSelecting(true);
    setStartIndex(index);
    onPatternChange(text[index] ?? "");
  };

  const extendSelection = (index: number) => {
    if (!selectMode || !isSelecting || startIndex === null) return;
    const from = Math.min(startIndex, index);
    const to = Math.max(startIndex, index);
    onPatternChange(text.slice(from, to + 1));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h3>Text preview</h3>
        <div className={styles.headerButtons}>
          <button
            type="button"
            className={`${styles.smallButton} ${
              showNgrams ? styles.smallButtonActive : ""
            }`}
            onClick={onToggleNgrams}
          >
            N-gram stats
          </button>
          <button
            type="button"
            className={`${styles.smallButton} ${
              selectMode ? styles.smallButtonActive : ""
            }`}
            onClick={onToggleSelectMode}
          >
            Selection mode: {selectMode ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={styles.row}
            style={{
              gridTemplateColumns: `repeat(${Math.min(
                charsPerRow,
                row.length || 1
              )}, minmax(${boxSize}px, 1fr))`,
            }}
          >
            {row.split("").map((ch, offset) => {
              const globalIndex = rowIndex * charsPerRow + offset;

              if (ch === " ") {
                return (
                  <div
                    key={globalIndex}
                    className={styles.spaceBox}
                    style={{ height: boxSize, minWidth: boxSize }}
                    title="space"
                  >
                    ·
                  </div>
                );
              }

              const lower = ch.toLowerCase();
              const mapped = mapping[lower];
              const hasMapping = mapped && mapped.length === 1;
              const displayChar = hasMapping ? mapped : ch;

              const isHovered =
                hoveredLetter !== null && lower === hoveredLetter;
              const isMatch = patternMatchIndices.has(globalIndex);

              const title = hasMapping ? `${ch} → ${mapped}` : ch;

              const classNames = [
                styles.box,
                hasMapping ? styles.boxMapped : "",
                isHovered ? styles.boxHover : "",
                isMatch ? styles.boxMatch : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={globalIndex}
                  className={classNames}
                  title={title}
                  style={{
                    height: boxSize,
                    minWidth: boxSize,
                    fontSize: `${fontSize}px`,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    beginSelection(globalIndex);
                  }}
                  onMouseEnter={() => extendSelection(globalIndex)}
                >
                  {displayChar}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
