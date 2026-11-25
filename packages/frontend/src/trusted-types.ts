// React creates <script> elements by parsing this, so that they don't execute
const SCRIPT_ELEMENT_HTML = "<script></script>";

export const allowHTML = (html: string) =>
  html === SCRIPT_ELEMENT_HTML ? html : null;

// Registered at the root, so that it controls the whole origin
const SERVICE_WORKER_PATH = "/sw.js";

/**
 * Same-origin only. Built chunks and workers (e.g. Sentry Replay's) are
 * served from /assets/; in dev, Vite serves them from arbitrary paths.
 */
export const allowScriptURL = (url: string, base: string, dev: boolean) => {
  const parsed = new URL(url, base);

  if (parsed.origin !== new URL(base).origin) {
    return null;
  }

  return dev ||
    parsed.pathname.startsWith("/assets/") ||
    parsed.pathname === SERVICE_WORKER_PATH
    ? parsed.href
    : null;
};
