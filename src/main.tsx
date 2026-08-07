import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "@/app/styles.css";
import { formatAppTitle } from "@/shared/constants/branding";
import { initTheme } from "@/shared/hooks/use-theme";

initTheme();
document.title = formatAppTitle();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
