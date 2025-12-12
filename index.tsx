import React from 'react';
import ReactDOM from 'react-dom/client';
// 👇 THIS LINE IS CRITICAL. IF MISSING, NO STYLES WILL LOAD
import './index.css'; 
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
