import { useState } from "react";
import styles from "./TextInputBar.module.css";

interface Props {
  text: string;
  onChangeText: (value: string) => void;
}

export const TextInputBar: React.FC<Props> = ({ text, onChangeText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(text);

  const preview =
    text.length > 40 ? text.slice(0, 40).replace(/\s+/g, " ") + "..." : text;

  const openModal = () => {
    setDraft(text);
    setIsOpen(true);
  };

  const save = () => {
    onChangeText(draft);
    setIsOpen(false);
  };

  return (
    <>
      <button className={styles.bar} onClick={openModal}>
        Deciphering this text:&nbsp;
        <span className={styles.preview}>"{preview}"</span>
      </button>

      {isOpen && (
        <div className={styles.backdrop} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Edit cipher text</h2>
            <textarea
              className={styles.textarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className={styles.actions}>
              <button onClick={() => setIsOpen(false)}>Cancel</button>
              <button className={styles.save} onClick={save}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
