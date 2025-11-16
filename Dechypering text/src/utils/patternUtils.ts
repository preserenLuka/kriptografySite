// src/utils/patternUtils.ts
import type { PatternMatches } from "../state/cipherTypes";

/**
 * Pattern match with '_' wildcard: '_' matches any character.
 */
export function findPatternMatches(
  text: string,
  pattern: string
): PatternMatches {
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

/**
 * Exact substring matches (no wildcard).
 * Used for suspected words underlines.
 */
export function findExactMatches(text: string, pattern: string): number[] {
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
