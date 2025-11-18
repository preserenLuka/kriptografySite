import styles from "./App.module.css";
import { TextInputBar } from "./components/TextInputBar";
import { TextGrid } from "./components/TextPreview/TextGrid";
import {
  SubstitutionPanel,
  SLO_ALPHABET,
} from "./components/SubstitutionPanel";
import { LetterStats } from "./components/LetterStatistics/LetterStats";
import { PatternPanel } from "./components/TextPreview/ExtraPanels/PatternPanel";
import { NgramStats } from "./components/TextPreview/ExtraPanels/NgramStats";
import { SuspectedWords } from "./components/TextPreview/ExtraPanels/SuspectedWords";
import { useCipherTool } from "./hooks/useCipherTool";

function App() {
  const {
    // state
    text,
    mapping,
    hoveredLetter,
    selectMode,
    pattern,
    patternMatches,
    showNgrams,
    showSuspected,
    suspectedWords,
    spaceMode,

    // derived
    suspectedColors,
    suspectedHighlightColors,
    suspectedSpaceSet,

    // handlers
    setText,
    setHoveredLetter,
    setPattern,
    handleMappingChange,
    toggleSelectMode,
    toggleNgrams,
    toggleSuspected,
    toggleSpaceMode,
    handleAddSpace,
    handleRemoveSpace,
    handleAddSuspected,
    handleRemoveSuspected,
  } = useCipherTool();

  const panelType = showNgrams
    ? "ngrams"
    : showSuspected
    ? "suspected"
    : selectMode
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
              onMappingChange={handleMappingChange} // now types match
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
                onPatternChange={setPattern}
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
