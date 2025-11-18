// src/utils/solver.ts
import type { Mapping } from "../state/cipherTypes";
// velik slovenski korpus, ki si ga dobil od prijatelja
// ⚠ Vite: ?raw vrne vsebino datoteke kot string
import slovarCorpus from "../data/slovar.txt?raw";

// slovenska abeceda – isti vrstni red kot v tvojem SLO_ALPHABET
const ALPH = "abcčdefghijklmnoprsštuvzž";

export interface AutoSolveOptions {
  iterations?: number; // koliko korakov hill-climba
  restarts?: number; // koliko random restartov
  startTemp?: number; // začetna temperatura za SA
  endTemp?: number; // končna temperatura
}

/* -------------------- OSNOVNI HELPERJI -------------------- */

export function applyMapping(text: string, mapping: Mapping): string {
  return text
    .split("")
    .map((ch) => {
      const lower = ch.toLowerCase();
      const mapped = mapping[lower];
      return mapped ? mapped.toUpperCase() : ch;
    })
    .join("");
}

function cleanText(s: string): string {
  const lower = s.toLowerCase();
  let out = "";
  for (const ch of lower) {
    if (ALPH.includes(ch)) out += ch;
  }
  return out;
}

/* -------------------- BIGRAM MODEL IZ SLOVARJA -------------------- */

function trainBigrams(corpus: string): number[][] {
  const text = cleanText(corpus);
  const n = ALPH.length;

  // counts[i][j] = koliko krat gre i -> j (z 0.5 smoothinga)
  const counts: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0.5)
  );

  const idx: number[] = [];
  for (const ch of text) {
    const i = ALPH.indexOf(ch);
    if (i >= 0) idx.push(i);
  }

  for (let k = 0; k < idx.length - 1; k++) {
    const a = idx[k];
    const b = idx[k + 1];
    if (a >= 0 && b >= 0) counts[a][b] += 1.0;
  }

  // pretvori v log-verjetnosti
  const logp: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0)
  );

  for (let i = 0; i < n; i++) {
    const row = counts[i];
    const rowSum = row.reduce((acc, v) => acc + v, 0);
    for (let j = 0; j < n; j++) {
      logp[i][j] = Math.log(row[j] / rowSum);
    }
  }

  return logp;
}

// enkrat ob importu izračunamo bigram matriko
const BIGRAM_LOGP: number[][] = trainBigrams(slovarCorpus);

/* -------------------- KLJUČ KOT PERMUTACIJA -------------------- */

function cipherToIndices(cipherText: string): number[] {
  const clean = cleanText(cipherText);
  const res: number[] = [];
  for (const ch of clean) {
    const idx = ALPH.indexOf(ch);
    if (idx >= 0) res.push(idx);
  }
  return res;
}

// decipher: cipher index i -> plain index keyPerm[i]
function decryptIndices(cipherIdx: number[], keyPerm: number[]): number[] {
  return cipherIdx.map((i) => keyPerm[i]);
}

function scoreIndices(
  cipherIdx: number[],
  keyPerm: number[],
  logp: number[][]
): number {
  const plainIdx = decryptIndices(cipherIdx, keyPerm);
  let s = 0;
  for (let k = 0; k < plainIdx.length - 1; k++) {
    const a = plainIdx[k];
    const b = plainIdx[k + 1];
    if (a >= 0 && b >= 0) {
      s += logp[a][b];
    }
  }
  return s;
}

function randomKey(): number[] {
  const perm = Array.from({ length: ALPH.length }, (_, i) => i);
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  return perm;
}

function keyToMapping(keyPerm: number[]): Mapping {
  const mapping: Mapping = {};
  for (let i = 0; i < ALPH.length; i++) {
    const cipher = ALPH[i]; // šifrirana črka
    const plain = ALPH[keyPerm[i]]; // odprta črka
    mapping[cipher] = plain.toUpperCase();
  }
  return mapping;
}

/* -------------------- HILL CLIMB + SA (v TS) -------------------- */

function hillClimb(
  cipherText: string,
  logp: number[][],
  options: AutoSolveOptions
): number[] {
  const iterations = options.iterations ?? 200_000;
  const startTemp = options.startTemp ?? 5.0;
  const endTemp = options.endTemp ?? 0.5;

  const cipherIdx = cipherToIndices(cipherText);

  let bestKey = randomKey();
  let bestScore = scoreIndices(cipherIdx, bestKey, logp);

  let currentKey = bestKey.slice();
  let currentScore = bestScore;

  for (let it = 1; it <= iterations; it++) {
    // linearno hlajenje
    const frac = it / iterations;
    const T = startTemp * (1 - frac) + endTemp * frac;

    // predlagaj swap dveh naključnih črk
    let a = Math.floor(Math.random() * ALPH.length);
    let b = Math.floor(Math.random() * ALPH.length);
    if (a === b) b = (b + 1) % ALPH.length;

    const newKey = currentKey.slice();
    const tmp = newKey[a];
    newKey[a] = newKey[b];
    newKey[b] = tmp;

    const newScore = scoreIndices(cipherIdx, newKey, logp);
    const delta = newScore - currentScore;

    if (delta > 0 || Math.random() < Math.exp(delta / T)) {
      currentKey = newKey;
      currentScore = newScore;

      if (newScore > bestScore) {
        bestScore = newScore;
        bestKey = newKey.slice();
      }
    }
  }

  return bestKey;
}

/* -------------------- JAVNI API ZA REACT APP -------------------- */

/**
 * Auto-solver: skoraj enaka logika kot Python skripta:
 * - bigram model iz slovar.txt
 * - hill-climbing + simulated annealing
 * - ključ kot permutacija abecede
 *
 * Vrne Mapping: šifrirana črka (lowercase) -> odprta črka (UPPERCASE),
 * ki jo tvoja app že zna uporabiti.
 */
export function autoSolve(
  cipherText: string,
  options: AutoSolveOptions = {}
): Mapping {
  // (po želji lahko dodaš assert, da je alphabet enak ALPH_ARRAY)

  const restarts = options.restarts ?? 3;

  let globalBestKey: number[] | null = null;
  let globalBestScore = -Infinity;
  const cipherIdx = cipherToIndices(cipherText);

  for (let r = 0; r < restarts; r++) {
    const key = hillClimb(cipherText, BIGRAM_LOGP, options);
    const s = scoreIndices(cipherIdx, key, BIGRAM_LOGP);
    if (s > globalBestScore || !globalBestKey) {
      globalBestScore = s;
      globalBestKey = key;
    }
  }

  const finalKey = globalBestKey ?? randomKey();
  return keyToMapping(finalKey);
}
