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

type TrustedTypePolicyOptions = {
  createHTML?: (input: string) => string | null;
  createScript?: (input: string) => string | null;
  createScriptURL?: (input: string) => string | null;
};

declare global {
  // Adopted by zod when it loads (zod/v4/core/core.js)
  var __zod_globalConfig: { jitless?: boolean } | undefined;

  interface Window {
    trustedTypes?: {
      createPolicy: (
        name: string,
        options: TrustedTypePolicyOptions,
      ) => unknown;
    };
    // stored by index.html for use with <pwa-install>
    promptEvent?: Event | undefined;
  }
}
