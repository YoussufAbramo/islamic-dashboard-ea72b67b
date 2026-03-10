import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove loading screen after React mounts
const removeLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 300);
  }
};

createRoot(document.getElementById("root")!).render(<App />);
requestAnimationFrame(() => setTimeout(removeLoader, 100));

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed silently
    });
  });
}
