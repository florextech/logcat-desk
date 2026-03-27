import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@renderer/App';
import '@renderer/index.css';
import { I18nProvider } from '@renderer/i18n/provider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
