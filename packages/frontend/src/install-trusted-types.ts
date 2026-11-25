import "./zod-jitless";
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
