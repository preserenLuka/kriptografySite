import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import styles from "./ToastContext.module.css";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // keep track of timeout IDs for each toast so we can clear them if needed
  const timeoutsRef = useRef<Record<string, number>>({});

  // cleanup on unmount: clear any pending timeouts to avoid state updates
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((tid) => {
        clearTimeout(tid);
      });
      timeoutsRef.current = {};
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    const tid = timeoutsRef.current[id];
    if (tid) {
      clearTimeout(tid);
      delete timeoutsRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: "success" | "error" | "info") => {
      const genId = () => {
        try {
          if (
            typeof crypto !== "undefined" &&
            typeof (crypto as any).randomUUID === "function"
          ) {
            return (crypto as any).randomUUID();
          }
        } catch (e) {
          // fallthrough to fallback
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      };

      const id = genId();
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-remove after 3 seconds and remember the timeout so it can be cleared
      const tid = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timeoutsRef.current[id];
      }, 3000);

      timeoutsRef.current[id] = tid;
    },
    []
  );

  const contextValue: ToastContextType = {
    success: (message) => addToast(message, "success"),
    error: (message) => addToast(message, "error"),
    info: (message) => addToast(message, "info"),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type]}`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
