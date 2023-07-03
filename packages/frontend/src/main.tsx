import React from 'react';
import ReactDOM from 'react-dom/client';

// https://mui.com/material-ui/getting-started/installation/#roboto-font
// Fontsource can be configured to load specific subsets, weights and styles.
// Material UI's default typography configuration relies only on the 300, 400, 500, and 700 font weights.\
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { App } from './App';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
