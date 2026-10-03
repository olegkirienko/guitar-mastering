import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { RouteProvider } from './providers/route-provider';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <RouteProvider>
        <App />
      </RouteProvider>
    </HashRouter>
  </StrictMode>,
);
