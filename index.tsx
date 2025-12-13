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
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
