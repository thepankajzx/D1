// Auto-reload on deployment chunk change
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});
document.documentElement.classList.remove('dark');
try { localStorage.removeItem('theme'); } catch(e) {}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from './registerServiceWorker'

// Error loggers
window.onerror = function(message, source, lineno, colno, error) {
  localStorage.setItem('last_crash', JSON.stringify({ message, source, lineno, colno, stack: error?.stack }));
};

window.addEventListener('unhandledrejection', function(event) {
  localStorage.setItem('last_crash_promise', JSON.stringify({ message: event.reason?.message, stack: event.reason?.stack }));
});

// Register Production Service Worker for PWA
registerSW();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
