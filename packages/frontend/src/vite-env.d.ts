/// <reference types="vite/client" />

import "react";

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }

  // Not yet in @types/react: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#credentialless
  interface IframeHTMLAttributes<T> {
    credentialless?: boolean | undefined;
  }
}

declare global {
  interface Window {
    // stored by index.html for use with <pwa-install>
    promptEvent?: Event | undefined;
  }
}
