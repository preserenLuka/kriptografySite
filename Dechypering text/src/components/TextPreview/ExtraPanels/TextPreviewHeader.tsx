import styles from "../TextGrid.module.css";

interface Props {
  showNgrams: boolean;
  showSuspected: boolean;
  spaceMode: boolean;
  selectMode: boolean;
  onToggleNgrams: () => void;
  onToggleSuspected: () => void;
  onToggleSpaceMode: () => void;
  onToggleSelectMode: () => void;

  onAutoSolve: () => void;
  isSolving: boolean;

  onDownloadText: () => void;
}

export const TextPreviewHeader: React.FC<Props> = ({
  showNgrams,
  showSuspected,
  spaceMode,
  selectMode,
  onToggleNgrams,
  onToggleSuspected,
  onToggleSpaceMode,
  onToggleSelectMode,
  onAutoSolve,
  isSolving,
  onDownloadText,
}) => {
  return (
    <div className={styles.headerRow}>
      <h3>Text preview</h3>
      <div className={styles.headerButtons}>
        <button
          type="button"
          className={`${styles.smallButton} ${
            showNgrams ? styles.smallButtonActive : ""
          }`}
          onClick={onToggleNgrams}
          disabled={isSolving}
        >
          N-gram stats
        </button>

        <button
          type="button"
          className={`${styles.smallButton} ${
            showSuspected ? styles.smallButtonActive : ""
          }`}
          onClick={onToggleSuspected}
          disabled={isSolving}
        >
          Suspected words
        </button>

        <button
          type="button"
          className={`${styles.smallButton} ${
            spaceMode ? styles.smallButtonActive : ""
          }`}
          onClick={onToggleSpaceMode}
          disabled={isSolving}
        >
          Suspected spaces
        </button>

        <button
          type="button"
          className={`${styles.smallButton} ${
            selectMode ? styles.smallButtonActive : ""
          }`}
          onClick={onToggleSelectMode}
          disabled={isSolving}
        >
          Selection mode: {selectMode ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          className={`${styles.smallButton} ${
            isSolving ? styles.smallButtonActive : ""
          }`}
          onClick={onAutoSolve}
          disabled={isSolving}
        >
          {isSolving ? "Auto-solving…" : "Auto-solve"}
        </button>

        <button
          type="button"
          className={styles.smallButton}
          onClick={onDownloadText}
          disabled={isSolving}
        >
          Download .txt
        </button>
      </div>
    </div>
  );
};
