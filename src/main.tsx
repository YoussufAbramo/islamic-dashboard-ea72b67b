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

// White-label: remove any injected third-party badges
const style = document.createElement('style');
style.textContent = '[data-lovable], #lovable-badge, [id*="lovable"], a[href*="lovable.dev"], [id*="gptengineer"], a[href*="gptengineer"] { display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; overflow: hidden !important; position: absolute !important; pointer-events: none !important; }';
document.head.appendChild(style);

const removeBadge = () => {
  document.querySelectorAll('[data-lovable], #lovable-badge, [id*="lovable"], a[href*="lovable.dev"], [id*="gptengineer"], a[href*="gptengineer"]').forEach(el => el.remove());
};
removeBadge();
const observer = new MutationObserver(removeBadge);
observer.observe(document.body, { childList: true, subtree: true });

// Register service worker for PWA with auto-versioned cache
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const { APP_VERSION } = await import('./lib/version');
      const reg = await navigator.serviceWorker.register('/sw.js');
      const sw = reg.active || reg.installing || reg.waiting;
      if (sw) {
        sw.postMessage({ type: 'SET_VERSION', version: APP_VERSION.replace(/\./g, '') });
      }
    } catch {
      // SW registration failed silently
    }
  });
}
