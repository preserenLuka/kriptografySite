import styles from "./SubstitutionPanel.module.css";
import type { Mapping } from "../App";

export const SLO_ALPHABET = [
  "a",
  "b",
  "c",
  "č",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "r",
  "s",
  "š",
  "t",
  "u",
  "v",
  "z",
  "ž",
];

interface Props {
  mapping: Mapping;
  onChangeMapping: (from: string, to: string) => void;
}

export const SubstitutionPanel: React.FC<Props> = ({
  mapping,
  onChangeMapping,
}) => {
  return (
    <div className={styles.panel}>
      <h3>Substitution</h3>
      <div className={styles.grid}>
        {SLO_ALPHABET.map((letter) => (
          <div key={letter} className={styles.cell}>
            <div className={styles.original}>{letter}</div>
            <input
              className={styles.input}
              maxLength={1}
              value={mapping[letter] ?? ""}
              onChange={(e) =>
                onChangeMapping(letter, e.target.value.toLowerCase())
              }
            />
          </div>
        ))}
      </div>
      <p className={styles.hint}>
        V polje spodaj vpišeš nadomestno črko (npr. pod <strong>a</strong>{" "}
        vpišeš <strong>e</strong>) in vse <strong>a</strong> v tekstu se
        spremenijo v <strong>e</strong>.
      </p>
    </div>
  );
};
