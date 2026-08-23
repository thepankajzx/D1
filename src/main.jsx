document.documentElement.classList.remove('dark');
try { localStorage.removeItem('theme'); } catch(e) {}
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.onerror = function(message, source, lineno, colno, error) {
  localStorage.setItem('last_crash', JSON.stringify({ message, source, lineno, colno, stack: error?.stack }));
};

window.addEventListener('unhandledrejection', function(event) {
  localStorage.setItem('last_crash_promise', JSON.stringify({ message: event.reason?.message, stack: event.reason?.stack }));
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
