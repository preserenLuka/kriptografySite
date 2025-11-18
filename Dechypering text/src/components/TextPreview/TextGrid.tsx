import { useEffect, useState } from "react";
import styles from "./TextGrid.module.css";
import type { Mapping } from "../../state/cipherTypes";
import { TextPreviewHeader } from "./ExtraPanels/TextPreviewHeader";
import { TextGridRow } from "./TextGridRow";
import { autoSolve, applyMapping } from "../../utils/solver";
// SLO_ALPHABET not needed here after solver API change

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

  // use the same signature as handleMappingChange(from, to)
  onMappingChange: (from: string, to: string) => void;
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
  onMappingChange,
}) => {
  const { charsPerRow, fontSize } = getLayout(text.length);

  const rows: string[] = [];
  for (let i = 0; i < text.length; i += charsPerRow) {
    rows.push(text.slice(i, i + charsPerRow));
  }

  const [isSelecting, setIsSelecting] = useState(false);
  const [startIndex, setStartIndex] = useState<number | null>(null);

  // ali auto-solver trenutno dela
  const [isSolving, setIsSolving] = useState(false);

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

  const handleAutoSolve = () => {
    if (!text || text.length === 0) return;
    if (isSolving) return;

    setIsSolving(true);

    // pustimo Reactu, da rerenderja (da vidiš "Auto-solving…"),
    // potem pa v setTimeout blokiramo z dejanskim računanjem
    setTimeout(() => {
      try {
        const solvedMapping: Mapping = autoSolve(text, {
          iterations: 20000,
          restarts: 8,
          startTemp: 1.8,
        });

        Object.entries(solvedMapping).forEach(([cipher, plain]) => {
          if (plain) {
            onMappingChange(cipher, plain);
          }
        });
      } catch (err) {
        console.error("Auto-solver failed:", err);
      } finally {
        setIsSolving(false);
      }
    }, 0);
  };

  const handleDownloadText = () => {
    // dešifriran tekst glede na trenutni mapping
    const plaintext = applyMapping(text, mapping);

    const blob = new Blob([plaintext], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "decrypted_text.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.wrapper}>
      <TextPreviewHeader
        showNgrams={showNgrams}
        showSuspected={showSuspected}
        spaceMode={spaceMode}
        selectMode={selectMode}
        onToggleNgrams={onToggleNgrams}
        onToggleSuspected={onToggleSuspected}
        onToggleSpaceMode={onToggleSpaceMode}
        onToggleSelectMode={onToggleSelectMode}
        onAutoSolve={handleAutoSolve}
        isSolving={isSolving}
        onDownloadText={handleDownloadText}
      />

      <div className={styles.grid}>
        {rows.map((row, rowIndex) => (
          <TextGridRow
            key={rowIndex}
            row={row}
            rowIndex={rowIndex}
            charsPerRow={charsPerRow}
            fontSize={fontSize}
            mapping={mapping}
            hoveredLetter={hoveredLetter}
            patternMatchIndices={patternMatchIndices}
            suspectedHighlightColors={suspectedHighlightColors}
            spaceMode={spaceMode}
            suspectedSpacePositions={suspectedSpacePositions}
            onAddSpace={onAddSpace}
            onRemoveSpace={onRemoveSpace}
            onBeginSelection={beginSelection}
            onExtendSelection={extendSelection}
          />
        ))}
      </div>
    </div>
  );
};
