import { allowHTML, allowScriptURL } from "./trusted-types";

/**
 * Not imported by the app: bundled into a standalone inline script that
 * __root.tsx renders first in <head> (bin/trusted-types-plugin.ts).
 */

// No createScript: eval-like sinks are always blocked
window.trustedTypes?.createPolicy("default", {
  createHTML: allowHTML,
  createScriptURL: (url) =>
    allowScriptURL(url, window.location.href, import.meta.env.DEV),
});

// Zod probes `new Function` (a Trusted Types sink, and blocked by the CSP)
// unless jitless. `z.config()` would bundle a copy of zod into the script, so
// set the global config object that zod adopts when it loads (checked in
// trusted-types.test.ts).
globalThis.__zod_globalConfig = {
  ...globalThis.__zod_globalConfig,
  jitless: true,
};
