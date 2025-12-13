import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; 
import App from './App';
// 👇 Ye line missing thi, isliye screen blank thi
import { AuthProvider } from './auth/useAuth';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* 👇 AuthProvider lagana zaroori hai */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
