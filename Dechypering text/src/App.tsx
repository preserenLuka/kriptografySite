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

export type Mapping = Record<string, string>;

export interface PatternMatches {
  starts: number[];
  indices: Set<number>;
}

const INITIAL_TEXT =
  "ČEGLIOGBŽČIHZLGAFRVTERPIDODGAKLŽKŽCŽJŽNŽAVČGDIELGČEGBGOOREVKISVLAVLAVMŽBTGONGROŽČINŽLDGBIMVČVTVLSBIOVNOVČEVLŽLEI..."; // daj svoj full tajnopis

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
      if (pc === "_") continue; // wildcard
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

type PanelType = "none" | "pattern" | "ngrams";

function App() {
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
      if (!next) {
        setPattern(""); // ko ugasneš selection, skrij pattern panel
      }
      setShowNgrams(false); // ne dovoli n-gram + pattern hkrati
      return next;
    });
  };

  const toggleNgrams = () => {
    setShowNgrams((prev) => {
      const next = !prev;
      if (next) {
        // ko prižgeš n-gram, ugasni pattern mode
        setSelectMode(false);
        setPattern("");
      }
      return next;
    });
  };

  // kdo je trenutno na desnem panelu
  const panelType: PanelType = showNgrams
    ? "ngrams"
    : selectMode && pattern.length > 0
    ? "pattern"
    : "none";

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
              onToggleNgrams={toggleNgrams}
              pattern={pattern}
              onPatternChange={setPattern}
              patternMatchIndices={patternMatches.indices}
            />
          </div>

          {panelType === "pattern" && (
            <div className={styles.topRight}>
              <PatternPanel
                text={text}
                pattern={pattern}
                matches={patternMatches}
                onClearPattern={() => setPattern("")}
              />
            </div>
          )}

          {panelType === "ngrams" && (
            <div className={styles.topRight}>
              <NgramStats text={text} />
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
