import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeWrapper } from "./ThemeWrapper";
import { ToastProvider } from "./components/ToastContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeWrapper>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeWrapper>
  </StrictMode>
);
