import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import "./index.css";

const THEME_KEY = "cipher-theme";
const THEMES = [
  { id: "dark", label: "Dark" },
  { id: "dim", label: "Dim" },
  { id: "light", label: "Light (high contrast)" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

export const ThemeWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeId>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY) as ThemeId | null;
    if (stored && THEMES.some((t) => t.id === stored)) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <div className={`theme-root theme-${theme}`}>
      <div className="theme-toolbar">
        <div className="theme-toolbar-inner">
          <label htmlFor="theme-select">Theme</label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeId)}
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {children}
    </div>
  );
};
