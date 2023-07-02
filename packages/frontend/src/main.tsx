import React from 'react';
import ReactDOM from 'react-dom/client';

import './main.css';

import { App } from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('div[id="root"] not found');
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
