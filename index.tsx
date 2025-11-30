
import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
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

// Register the PWA service worker (auto-generated via vite-plugin-pwa)
registerSW({
  immediate: true,
  onRegistered(swRegistration) {
    if (swRegistration) {
      console.log('[PWA] Service worker registered', swRegistration.scope);
    }
  },
  onRegisterError(error) {
    console.error('[PWA] Service worker registration failed:', error);
  },
});
