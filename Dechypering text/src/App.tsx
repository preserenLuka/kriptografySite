import { useEffect, useState } from "react";
import styles from "./App.module.css";
import { TextInputBar } from "./components/TextInputBar";
import { TextGrid } from "./components/TextGrid";
import {
  SubstitutionPanel,
  SLO_ALPHABET,
} from "./components/SubstitutionPanel";
import { LetterStats } from "./components/LetterStats";
import { PatternPanel } from "./components/PatternPanel";
import { NgramStats } from "./components/NgramStats";
import { SuspectedWords } from "./components/SuspectedWords";
import { useToast } from "./components/ToastContext";

export type Mapping = Record<string, string>;

export interface PatternMatches {
  starts: number[];
  indices: Set<number>;
}

const INITIAL_TEXT =
  "ČEGLIOGBŽČIHZLGAFRVTERPIDODGAKLŽKŽCŽJŽNŽAVČGDIELGČEGBGOOREVKISVLAVLAVMŽBTGONGROŽČINŽLDGBIMVČVTVLSBIOVNOVČEVLŽLEI...";

const MAX_SUSPECTED_LENGTH = 25;

// colors for suspected words (cycled if more than 5)
const SUSPECT_COLORS = ["#f97316", "#22c55e", "#eab308", "#ec4899", "#06b6d4"];

function findPatternMatches(text: string, pattern: string): PatternMatches {
  const result: PatternMatches = { starts: [], indices: new Set<number>() };
  if (!pattern) return result;

  const t = text.toLowerCase();
  const p = pattern.toLowerCase();
  const plen = p.length;
  if (plen === 0) return result;

  for (let i = 0; i <= t.length - plen; i++) {
    let ok = true;
    for (let j = 0; j < plen; j++) {
      const pc = p[j];
      if (pc === "_") continue;
      if (t[i + j] !== pc) {
        ok = false;
        break;
      }
    }
    if (ok) {
      result.starts.push(i);
      for (let j = 0; j < plen; j++) {
        result.indices.add(i + j);
      }
    }
  }
  return result;
}

// exact matches, no wildcards, used for suspected words
function findExactMatches(text: string, pattern: string): number[] {
  const res: number[] = [];
  const t = text.toLowerCase();
  const p = pattern.toLowerCase();
  const plen = p.length;
  if (!plen) return res;

  for (let i = 0; i <= t.length - plen; i++) {
    if (t.slice(i, i + plen) === p) {
      res.push(i);
    }
  }
  return res;
}

type PanelType = "none" | "pattern" | "ngrams" | "suspected";

function App() {
  const notify = useToast();

  const [text, setText] = useState<string>(INITIAL_TEXT);
  const [mapping, setMapping] = useState<Mapping>({});
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [pattern, setPattern] = useState<string>("");
  const [patternMatches, setPatternMatches] = useState<PatternMatches>({
    starts: [],
    indices: new Set<number>(),
  });

  const [showNgrams, setShowNgrams] = useState(false);
  const [showSuspected, setShowSuspected] = useState(false);
  const [suspectedWords, setSuspectedWords] = useState<string[]>([]);

  const handleMappingChange = (from: string, to: string) => {
    setMapping((prev) => ({
      ...prev,
      [from]: to,
    }));
  };

  useEffect(() => {
    setPatternMatches(findPatternMatches(text, pattern));
  }, [text, pattern]);

  const toggleSelectMode = () => {
    setSelectMode((prev) => {
      const next = !prev;
      if (next) {
        setShowNgrams(false);
        setShowSuspected(false);
      } else {
        setPattern("");
      }
      return next;
    });
  };

  const toggleNgrams = () => {
    setShowNgrams((prev) => {
      const next = !prev;
      if (next) {
        setShowSuspected(false);
        setSelectMode(false);
        setPattern("");
      }
      return next;
    });
  };

  const toggleSuspected = () => {
    setShowSuspected((prev) => {
      const next = !prev;
      if (next) {
        setShowNgrams(false);
        setSelectMode(false);
        setPattern("");
      }
      return next;
    });
  };

  const handleAddSuspected = (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) {
      notify.error("Cannot add empty word.");
      return;
    }

    if (trimmed.length > MAX_SUSPECTED_LENGTH) {
      notify.error(
        `Word is too long (max ${MAX_SUSPECTED_LENGTH} characters).`
      );
      return;
    }

    if (suspectedWords.includes(trimmed)) {
      notify.error("This word is already in suspected words.");
      return;
    }

    setSuspectedWords((prev) => [...prev, trimmed]);
    notify.success(`Added "${trimmed}" to suspected words.`);
  };

  const handleRemoveSuspected = (word: string) => {
    setSuspectedWords((prev) => prev.filter((w) => w !== word));
    notify.success(`Removed "${word}" from suspected words.`);
  };

  // colors per suspected word (same order)
  const suspectedColors = suspectedWords.map(
    (_, idx) => SUSPECT_COLORS[idx % SUSPECT_COLORS.length]
  );

  // map of index -> color for underlines in Text preview
  const suspectedHighlightColors: Record<number, string> = {};
  suspectedWords.forEach((word, wordIdx) => {
    const color = suspectedColors[wordIdx];
    const starts = findExactMatches(text, word);
    starts.forEach((start) => {
      for (let i = 0; i < word.length; i++) {
        suspectedHighlightColors[start + i] = color;
      }
    });
  });

  let panelType: PanelType = "none";
  if (showNgrams) panelType = "ngrams";
  else if (showSuspected) panelType = "suspected";
  else if (selectMode) panelType = "pattern";

  const leftClass = panelType === "none" ? styles.fullWidth : styles.topLeft;

  return (
    <div className={styles.app}>
      <TextInputBar text={text} onChangeText={setText} />

      <div className={styles.mainContent}>
        <div className={styles.topSection}>
          <div className={leftClass}>
            <TextGrid
              text={text}
              mapping={mapping}
              hoveredLetter={hoveredLetter}
              selectMode={selectMode}
              onToggleSelectMode={toggleSelectMode}
              showNgrams={showNgrams}
              showSuspected={showSuspected}
              onToggleNgrams={toggleNgrams}
              onToggleSuspected={toggleSuspected}
              pattern={pattern}
              onPatternChange={setPattern}
              patternMatchIndices={patternMatches.indices}
              suspectedHighlightColors={suspectedHighlightColors}
            />
          </div>

          {panelType === "pattern" && (
            <div className={styles.topRight}>
              <PatternPanel
                text={text}
                pattern={pattern}
                matches={patternMatches}
                onClearPattern={() => setPattern("")}
                onAddSuspected={handleAddSuspected}
              />
            </div>
          )}

          {panelType === "ngrams" && (
            <div className={styles.topRight}>
              <NgramStats text={text} />
            </div>
          )}

          {panelType === "suspected" && (
            <div className={styles.topRight}>
              <SuspectedWords
                words={suspectedWords}
                mapping={mapping}
                onRemoveWord={handleRemoveSuspected}
                colors={suspectedColors}
              />
            </div>
          )}
        </div>

        <SubstitutionPanel
          mapping={mapping}
          onChangeMapping={handleMappingChange}
        />

        <LetterStats
          text={text}
          alphabet={SLO_ALPHABET}
          onHoverLetter={setHoveredLetter}
        />
      </div>
    </div>
  );
}

export default App;
