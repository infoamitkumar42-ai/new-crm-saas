import React from 'react';
import ReactDOM from 'react-dom/client';
// 👇 Ye line sabse zaroori hai, isse hi Rang (Colors) aayenge
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
