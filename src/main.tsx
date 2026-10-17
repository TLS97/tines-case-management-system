import '@fontsource-variable/inter';
import '@digdir/designsystemet-css';
import '../design-tokens-build/htil-theme.css';
import './app/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { startMockApi } from '@/mocks/browser';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found in index.html');

// v1 runs only against the mock API, in development and in production builds (decision 0002).
await startMockApi();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
