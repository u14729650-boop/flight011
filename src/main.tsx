import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/sections.css';
import './styles/pages.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Hide the branded loading screen once the app has painted (kept short on purpose).
const loader = document.getElementById('ya2-loader');
if (loader) {
  const shownFor = performance.now();
  const hide = () => {
    loader.classList.add('done');
    window.setTimeout(() => loader.remove(), 600);
  };
  window.setTimeout(hide, Math.max(0, 1300 - shownFor));
}
