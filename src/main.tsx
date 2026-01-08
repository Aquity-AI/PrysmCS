import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[PrysmCS] main.tsx loading');
const rootElement = document.getElementById('root');
console.log('[PrysmCS] Root element:', rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('[PrysmCS] React app mounted');
} else {
  console.error('[PrysmCS] Root element not found!');
}
