// src/hooks/useCipherTool.ts
import { useEffect, useMemo, useState } from "react";
import type {
  Mapping,
  PatternMatches,
  PersistedState,
} from "../state/cipherTypes";
import { findExactMatches, findPatternMatches } from "../utils/patternUtils";
import { useToast } from "../utils/ToastContext";

const STORAGE_KEY = "cipher-tool-state-v1";
const MAX_SUSPECTED_LENGTH = 25;
function colorFromIndex(i: number): string {
  // 47 is arbitrary but gives nice spread around color wheel
  const hue = (i * 47) % 360;
  return `hsl(${hue}, 85%, 60%)`;
}

const INITIAL_TEXT =
  "ČEGLIOGBŽČIHZLGAFRVTERPIDODGAKLŽKŽCŽJŽNŽAVČGDIELGČEGBGOOREVKISVLAVLAVMŽBTGONGROŽČINŽLDGBIMVČVTVLSBIOVNOVČEVLŽLEI...";

export function useCipherTool() {
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

  const [spaceMode, setSpaceMode] = useState(false);
  const [suspectedSpaces, setSuspectedSpaces] = useState<number[]>([]);

  const [hasLoaded, setHasLoaded] = useState(false);

  // ---------- LOAD FROM LOCALSTORAGE ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState> | null;
        if (parsed?.text) setText(parsed.text);
        if (parsed?.mapping) setMapping(parsed.mapping);
        if (Array.isArray(parsed?.suspectedWords)) {
          setSuspectedWords(parsed.suspectedWords);
        }
        if (Array.isArray(parsed?.suspectedSpaces)) {
          setSuspectedSpaces(parsed.suspectedSpaces.map(Number));
        }
      }
    } catch (err) {
      console.error("Failed to load cipher state from localStorage", err);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  // ---------- SAVE TO LOCALSTORAGE ----------
  useEffect(() => {
    if (!hasLoaded) return;

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

  // ---------- DERIVED & HANDLERS ----------

  // recompute pattern matches
  useEffect(() => {
    setPatternMatches(findPatternMatches(text, pattern));
  }, [text, pattern]);

  const handleMappingChange = (from: string, to: string) => {
    setMapping((prev) => ({
      ...prev,
      [from]: to,
    }));
  };

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

  const toggleSpaceMode = () => setSpaceMode((prev) => !prev);

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
    notify.success(`Added \"${trimmed}\" to suspected words.`);
  };

  const handleRemoveSuspected = (word: string) => {
    setSuspectedWords((prev) => prev.filter((w) => w !== word));
    notify.success(`Removed \"${word}\" from suspected words.`);
  };

  // colours for suspected words
  const suspectedColors = useMemo(
    () => suspectedWords.map((_, idx) => colorFromIndex(idx)),
    [suspectedWords]
  );

  // index -> colour for underlines in TextGrid
  const suspectedHighlightColors = useMemo(() => {
    const out: Record<number, string> = {};
    suspectedWords.forEach((word, wordIdx) => {
      const color = suspectedColors[wordIdx];
      const starts = findExactMatches(text, word);
      starts.forEach((start) => {
        for (let i = 0; i < word.length; i++) {
          out[start + i] = color;
        }
      });
    });
    return out;
  }, [text, suspectedWords, suspectedColors]);

  const suspectedSpaceSet = useMemo(
    () => new Set<number>(suspectedSpaces),
    [suspectedSpaces]
  );

  return {
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
    suspectedSpaces,

    // derived
    suspectedColors,
    suspectedHighlightColors,
    suspectedSpaceSet,

    // setters / handlers
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
  };
}
