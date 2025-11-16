import styles from "./TextGrid.module.css";
import type { Mapping } from "../../state/cipherTypes";

interface Props {
  row: string;
  rowIndex: number;
  charsPerRow: number;
  fontSize: number;
  mapping: Mapping;
  hoveredLetter: string | null;
  patternMatchIndices: Set<number>;
  suspectedHighlightColors?: Record<number, string>;
  spaceMode: boolean;
  suspectedSpacePositions: Set<number>;
  onAddSpace: (index: number) => void;
  onRemoveSpace: (index: number) => void;
  // selection
  onBeginSelection: (globalIndex: number) => void;
  onExtendSelection: (globalIndex: number) => void;
}

type Cell =
  | { kind: "letter"; ch: string; globalIndex: number }
  | { kind: "space"; globalIndex: number }
  | { kind: "suspectedSpace"; globalIndex: number };

export const TextGridRow: React.FC<Props> = ({
  row,
  rowIndex,
  charsPerRow,
  fontSize,
  mapping,
  hoveredLetter,
  patternMatchIndices,
  suspectedHighlightColors,
  spaceMode,
  suspectedSpacePositions,
  onAddSpace,
  onRemoveSpace,
  onBeginSelection,
  onExtendSelection,
}) => {
  const letters = row.split("");
  const rowStartIndex = rowIndex * charsPerRow;

  const cells: Cell[] = [];

  letters.forEach((ch, offset) => {
    const globalIndex = rowStartIndex + offset;

    // suspected space BEFORE this character (index points to the letter)
    if (suspectedSpacePositions.has(globalIndex)) {
      cells.push({ kind: "suspectedSpace", globalIndex });
    }

    if (ch === " ") {
      cells.push({ kind: "space", globalIndex });
    } else {
      cells.push({ kind: "letter", ch, globalIndex });
    }
  });

  const empties = Math.max(0, charsPerRow - letters.length);
  const totalCols = cells.length + empties;

  return (
    <div
      className={styles.row}
      style={{
        gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))`,
        fontSize: `${fontSize}px`,
      }}
    >
      {cells.map((cell, idx) => {
        if (cell.kind === "space") {
          // natural space from the original text → just a dot as before
          return (
            <div
              key={`space-${cell.globalIndex}-${idx}`}
              className={`${styles.cell} ${styles.spaceBox}`}
              title="space"
            >
              ·
            </div>
          );
        }

        if (cell.kind === "suspectedSpace") {
          const hasSpaceHere = suspectedSpacePositions.has(cell.globalIndex);

          return (
            <div
              key={`suspace-${cell.globalIndex}-${idx}`}
              className={`${styles.cell} ${styles.spaceBox} ${styles.suspectedSpaceBox}`}
              title={
                spaceMode
                  ? "Click to remove suspected space"
                  : "Suspected space"
              }
              onClick={
                spaceMode
                  ? (e) => {
                      e.stopPropagation();
                      if (hasSpaceHere) {
                        onRemoveSpace(cell.globalIndex);
                      }
                    }
                  : undefined
              }
            >
              <span className={styles.spaceDot}>·</span>
              {spaceMode && hasSpaceHere && (
                <span className={styles.spaceMarkerX}>×</span>
              )}
            </div>
          );
        }

        // LETTER CELL
        const { ch, globalIndex } = cell;
        const lower = ch.toLowerCase();
        const mapped = mapping[lower];
        const hasMapping = mapped && mapped.length === 1;
        const displayChar = hasMapping ? mapped : ch;

        const isHovered = hoveredLetter !== null && lower === hoveredLetter;
        const isMatch = patternMatchIndices.has(globalIndex);
        const highlightColor = suspectedHighlightColors?.[globalIndex];

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

        const hasSpaceBefore = suspectedSpacePositions.has(globalIndex);

        return (
          <div
            key={`char-${globalIndex}-${idx}`}
            className={classNames}
            title={title}
            style={{
              borderBottom: highlightColor
                ? `3px solid ${highlightColor}`
                : undefined,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              onBeginSelection(globalIndex);
            }}
            onMouseEnter={() => onExtendSelection(globalIndex)}
            onClick={
              spaceMode
                ? (e) => {
                    e.stopPropagation();
                    if (hasSpaceBefore) {
                      onRemoveSpace(globalIndex);
                    } else {
                      onAddSpace(globalIndex);
                    }
                  }
                : undefined
            }
          >
            {displayChar}
          </div>
        );
      })}

      {Array.from({ length: empties }).map((_, i) => (
        <div key={`empty-${rowIndex}-${i}`} className={styles.emptyCell} />
      ))}
    </div>
  );
};
