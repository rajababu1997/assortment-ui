import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './providers/AppProviders';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
);

const splash = document.getElementById('splash-screen');
if (splash) {
  splash.classList.add('hidden');
  document.body.classList.add('splash-hidden');
  setTimeout(() => splash.remove(), 400);
}
