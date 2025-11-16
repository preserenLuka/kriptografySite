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
        >
          N-gram stats
        </button>
        <button
          type="button"
          className={`${styles.smallButton} ${
            showSuspected ? styles.smallButtonActive : ""
          }`}
          onClick={onToggleSuspected}
        >
          Suspected words
        </button>
        <button
          type="button"
          className={`${styles.smallButton} ${
            spaceMode ? styles.smallButtonActive : ""
          }`}
          onClick={onToggleSpaceMode}
        >
          Suspected spaces
        </button>
        <button
          type="button"
          className={`${styles.smallButton} ${
            selectMode ? styles.smallButtonActive : ""
          }`}
          onClick={onToggleSelectMode}
        >
          Selection mode: {selectMode ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
};
