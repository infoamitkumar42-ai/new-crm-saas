import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// 👇 Ye hona chahiye
import { AuthProvider } from './auth/useAuth';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  // 🛑 GLOBAL ERROR SUPPRESSION (Permanent Fix)
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'AbortError' || event.reason?.message?.includes('aborted')) {
      event.preventDefault(); // Prevent "Uncaught (in promise)" error
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
