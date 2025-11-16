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
  showSuspected: boolean;
  onToggleNgrams: () => void;
  onToggleSuspected: () => void;
  pattern: string;
  onPatternChange: (pattern: string) => void;
  patternMatchIndices: Set<number>;
  suspectedHighlightColors?: Record<number, string>;

  // suspected spaces
  spaceMode: boolean;
  onToggleSpaceMode: () => void;
  suspectedSpacePositions: Set<number>;
  onAddSpace: (index: number) => void;
  onRemoveSpace: (index: number) => void;
}

// layout for whole text
function getLayout(length: number) {
  if (length <= 150) {
    return { charsPerRow: Math.min(30, Math.max(10, length)), fontSize: 16 };
  }
  if (length <= 700) {
    return { charsPerRow: 40, fontSize: 14 };
  }
  return { charsPerRow: 50, fontSize: 13 };
}

export const TextGrid: React.FC<Props> = ({
  text,
  mapping,
  hoveredLetter,
  selectMode,
  onToggleSelectMode,
  showNgrams,
  showSuspected,
  onToggleNgrams,
  onToggleSuspected,
  onPatternChange,
  patternMatchIndices,
  suspectedHighlightColors,
  spaceMode,
  onToggleSpaceMode,
  suspectedSpacePositions,
  onAddSpace,
  onRemoveSpace,
}) => {
  const { charsPerRow, fontSize } = getLayout(text.length);

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
              showSuspected ? styles.smallButtonActive : ""
            }`}
            onClick={onToggleSuspected}
          >
            Suspected words
          </button>
          <button
            type="button"
            className={`${styles.smallButton} ${
              spaceMode ? styles.smallButtonActive : ""
            }`}
            onClick={onToggleSpaceMode}
          >
            Suspected spaces
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
        {rows.map((row, rowIndex) => {
          const letters = row.split("");
          const empties = Math.max(0, charsPerRow - letters.length);

          return (
            <div
              key={rowIndex}
              className={styles.row}
              style={{
                gridTemplateColumns: `repeat(${charsPerRow}, minmax(0, 1fr))`,
                fontSize: `${fontSize}px`,
              }}
            >
              {letters.map((ch, offset) => {
                const globalIndex = rowIndex * charsPerRow + offset;

                if (ch === " ") {
                  return (
                    <div
                      key={globalIndex}
                      className={`${styles.cell} ${styles.spaceBox}`}
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

                const highlightColor = suspectedHighlightColors?.[globalIndex];

                const hasSpaceHere = suspectedSpacePositions.has(globalIndex);

                const title = hasMapping ? `${ch} → ${mapped}` : ch;

                const classNames = [
                  styles.cell,
                  styles.box,
                  hasMapping ? styles.boxMapped : "",
                  isHovered ? styles.boxHover : "",
                  isMatch ? styles.boxMatch : "",
                  spaceMode ? styles.cellSpaceMode : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                const showMarker = spaceMode || hasSpaceHere;

                return (
                  <div
                    key={globalIndex}
                    className={classNames}
                    title={title}
                    style={{
                      borderBottom: highlightColor
                        ? `3px solid ${highlightColor}`
                        : undefined,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      beginSelection(globalIndex);
                    }}
                    onMouseEnter={() => extendSelection(globalIndex)}
                  >
                    {showMarker && (
                      <div
                        className={`${styles.spaceMarker} ${
                          hasSpaceHere ? styles.spaceMarkerActive : ""
                        }`}
                        style={{
                          cursor: spaceMode ? "pointer" : "default",
                        }}
                        onClick={
                          spaceMode
                            ? (e) => {
                                e.stopPropagation();
                                if (hasSpaceHere) {
                                  onRemoveSpace(globalIndex);
                                } else {
                                  onAddSpace(globalIndex);
                                }
                              }
                            : undefined
                        }
                        title={
                          spaceMode
                            ? hasSpaceHere
                              ? "Click to remove suspected space"
                              : "Click to add suspected space before this letter"
                            : hasSpaceHere
                            ? "Suspected space"
                            : undefined
                        }
                      >
                        {spaceMode && hasSpaceHere && (
                          <span className={styles.spaceMarkerX}>×</span>
                        )}
                      </div>
                    )}
                    {displayChar}
                  </div>
                );
              })}

              {Array.from({ length: empties }).map((_, i) => (
                <div
                  key={`empty-${rowIndex}-${i}`}
                  className={styles.emptyCell}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
