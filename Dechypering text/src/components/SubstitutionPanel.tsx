import styles from "./SubstitutionPanel.module.css";
import type { Mapping } from "../state/cipherTypes";
import { useToast } from "../utils/ToastContext";
import { FiTrash2 } from "react-icons/fi";

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
  const notify = useToast();

  const handleChange = (from: string, rawValue: string) => {
    if (rawValue === "") {
      onChangeMapping(from, "");
      return;
    }

    const upper = rawValue.charAt(0).toUpperCase();
    const lower = upper.toLowerCase();

    const conflictEntry = Object.entries(mapping).find(
      ([key, value]) => key !== from && value === lower
    );

    if (conflictEntry) {
      notify.error(
        `Letter "${upper}" is already used as substitution for "${conflictEntry[0].toUpperCase()}".`
      );
      return;
    }

    onChangeMapping(from, lower);
  };

  const handleClearAll = () => {
    SLO_ALPHABET.forEach((letter) => onChangeMapping(letter, ""));
    notify.info("Cleared all substitutions.");
  };

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <h3
          className={styles.title}
          title={
            'Type the replacement letter below (e.g. under "A" you type "E") and every A in the text will change to E.'
          }
        >
          Substitution
        </h3>
        <button
          type="button"
          className={styles.clearButton}
          title="Clear all substitutions"
          aria-label="Clear all substitutions"
          onClick={handleClearAll}
        >
          <FiTrash2 />
        </button>
      </div>

      <div className={styles.grid}>
        {SLO_ALPHABET.map((letter) => (
          <div key={letter} className={styles.cell}>
            <div className={styles.original}>{letter.toUpperCase()}</div>
            <input
              className={styles.input}
              maxLength={1}
              value={(mapping[letter] ?? "").toUpperCase()}
              onChange={(e) => handleChange(letter, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
