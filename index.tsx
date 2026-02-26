import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// 👇 Ye hona chahiye
import { AuthProvider } from './auth/useAuth';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root not found");

const root = ReactDOM.createRoot(rootElement);

// 🚀 AUTO-UPDATE PWA (Permanent Fix for stuck mobile devices)
if ('serviceWorker' in navigator) {
  // @ts-ignore - Virtual module handled by vite-plugin-pwa
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('🔄 New update available! Refreshing directly...');
        updateSW(true); // Automatically apply the update without user prompt
      },
      onOfflineReady() {
        console.log('⚡ App is ready to work offline.');
      },
    });
  }).catch(err => {
    console.warn('⚠️ PWA Registration skipped (likely development mode):', err);
  });
}

// 🛑 GLOBAL ERROR SUPPRESSION (Permanent Fix)
window.addEventListener('unhandledrejection', (event) => {
  // Silence specific AbortError noise from Supabase/Vite
  const reason = event.reason;
  const msg = reason?.message || reason?.toString() || '';

  if (
    reason?.name === 'AbortError' ||
    msg.includes('aborted') ||
    msg.includes('AbortError')
  ) {
    event.preventDefault();
    return;
  }
});

root.render(
  // <React.StrictMode>  <-- REMOVED TO PREVENT DOUBLE-FETCH / ABORT LOOPS
  <AuthProvider>
    <App />
  </AuthProvider>
  // </React.StrictMode>
);
