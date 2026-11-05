import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Service worker = the PWA half of Phase 3.5 (offline shell + installability).
// PROD-only: dev HMR and a caching SW fight each other, and Vite's dev server
// URLs (/src/main.tsx) don't exist in the production shell layout anyway.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // A dead SW must never break the app — it only ever ADDS caching.
      console.warn('Service worker registration failed (app still online-capable):', err);
    });
  });
}
