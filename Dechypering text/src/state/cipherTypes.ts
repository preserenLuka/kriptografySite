// src/state/cipherTypes.ts

export type Mapping = Record<string, string>;

export interface PatternMatches {
  starts: number[];
  indices: Set<number>;
}

export interface PersistedState {
  text: string;
  mapping: Mapping;
  suspectedWords: string[];
  suspectedSpaces: number[];
}
