import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// 👇 Ye hona chahiye
import { AuthProvider } from './auth/useAuth';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root not found");

const root = ReactDOM.createRoot(rootElement);

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
