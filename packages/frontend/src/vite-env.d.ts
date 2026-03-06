/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import "react";

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

declare global {
  interface Window {
    // stored by index.html for use with <pwa-install>
    promptEvent?: Event | undefined;
  }
}
