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

// localStorage key
const STORAGE_KEY = "cipher-tool-state-v1";

interface PersistedState {
  text: string;
  mapping: Mapping;
  suspectedWords: string[];
  suspectedSpaces: number[];
}

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

// exact matches, used for suspected words highlighting
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

  // suspected spaces (indices in text where a space is suspected BEFORE the char)
  const [spaceMode, setSpaceMode] = useState(false);
  const [suspectedSpaces, setSuspectedSpaces] = useState<number[]>([]);

  // flag to avoid saving before we’ve loaded existing state
  const [hasLoaded, setHasLoaded] = useState(false);

  // ---------- LOAD FROM LOCALSTORAGE ONCE ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState> | null;
        if (parsed) {
          if (typeof parsed.text === "string") {
            setText(parsed.text);
          }
          if (parsed.mapping && typeof parsed.mapping === "object") {
            setMapping(parsed.mapping);
          }
          if (Array.isArray(parsed.suspectedWords)) {
            setSuspectedWords(parsed.suspectedWords);
          }
          if (Array.isArray(parsed.suspectedSpaces)) {
            setSuspectedSpaces(parsed.suspectedSpaces.map((n) => Number(n)));
          }
        }
      }
    } catch (err) {
      console.error("Failed to load cipher state from localStorage", err);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  // ---------- SAVE TO LOCALSTORAGE WHEN STATE CHANGES ----------
  useEffect(() => {
    if (!hasLoaded) return; // don’t overwrite storage before initial load

    const stateToSave: PersistedState = {
      text,
      mapping,
      suspectedWords,
      suspectedSpaces,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error("Failed to save cipher state to localStorage", err);
    }
  }, [hasLoaded, text, mapping, suspectedWords, suspectedSpaces]);

  // ---------- REST OF LOGIC ----------

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

  const toggleSpaceMode = () => {
    setSpaceMode((prev) => !prev);
  };

  const handleAddSpace = (index: number) => {
    setSuspectedSpaces((prev) =>
      prev.includes(index) ? prev : [...prev, index]
    );
  };

  const handleRemoveSpace = (index: number) => {
    setSuspectedSpaces((prev) => prev.filter((i) => i !== index));
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

  // colors per suspected word
  const suspectedColors = suspectedWords.map(
    (_, idx) => SUSPECT_COLORS[idx % SUSPECT_COLORS.length]
  );

  // index -> color for underlines in Text preview
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

  const suspectedSpaceSet = new Set<number>(suspectedSpaces);

  let panelType: PanelType = "none";
  if (showNgrams) panelType = "ngrams";
  else if (showSuspected) panelType = "suspected";
  else if (selectMode) panelType = "pattern";

  const leftClass = panelType === "none" ? styles.fullWidth : styles.topLeft;

  return (
    <div className={styles.app}>
      {/* This text is fully controlled by `text`, so it’s now persisted too */}
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
              spaceMode={spaceMode}
              onToggleSpaceMode={toggleSpaceMode}
              suspectedSpacePositions={suspectedSpaceSet}
              onAddSpace={handleAddSpace}
              onRemoveSpace={handleRemoveSpace}
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
