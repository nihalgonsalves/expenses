export const generateNonce = () =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));

/** DSN `https://<key>@<host>/<project>` → ingest origin + security report URL. */
export const parseSentryDsn = (dsn: string | undefined) => {
  if (!dsn) {
    return undefined;
  }

  try {
    const url = new URL(dsn);
    const projectId = url.pathname.split("/").findLast(Boolean);

    if (!url.username || !projectId) {
      return undefined;
    }

    return {
      origin: url.origin,
      reportUri: `${url.origin}/api/${projectId}/security/?sentry_key=${url.username}`,
    };
  } catch {
    return undefined;
  }
};

type Directives = Record<string, string[] | undefined>;

const serialize = (directives: Directives) =>
  Object.entries(directives)
    .flatMap(([name, sources]) =>
      sources ? [[name, ...sources].join(" ")] : [],
    )
    .join("; ");

export const SERVICE_WORKER_CSP = serialize({
  "default-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'none'"],
});

const NONCE = "{nonce}";
const REPORTING_ENDPOINT = "csp-endpoint";

type SecurityHeadersOptions = {
  dev: boolean;
  sentryDsn: string | undefined;
  reportOnly: boolean;
};

/**
 * Builds the headers once; the returned function only fills in the nonce.
 * Without a nonce (non-document responses), the CSP headers are omitted.
 */
export const createSecurityHeaders = ({
  dev,
  sentryDsn,
  reportOnly,
}: SecurityHeadersOptions) => {
  const sentry = parseSentryDsn(sentryDsn);
  const reportTo = sentry ? [REPORTING_ENDPOINT] : undefined;

  const csp = serialize({
    "default-src": ["'self'"],
    // Dev: Vite HMR/React refresh need these; a nonce would disable unsafe-inline
    "script-src": dev
      ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
      : [`'nonce-${NONCE}'`, "'strict-dynamic'"],
    "style-src-elem": ["'self'", dev ? "'unsafe-inline'" : `'nonce-${NONCE}'`],
    // Nonces can't cover style="" attributes from SSR'd UI libraries
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": dev ? ["'self'", "data:"] : undefined, // jotai-devtools
    "connect-src": [
      "'self'",
      ...(sentry ? [sentry.origin] : []),
      ...(dev ? ["ws:", "wss:"] : []),
    ],
    // Explicit so 'strict-dynamic' doesn't block the SW; blob: for Sentry replay
    "worker-src": ["'self'", "blob:"],
    "frame-src": dev ? ["http://*:8025"] : undefined, // Mailpit
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": dev ? undefined : [],
    "report-to": reportTo,
  });

  const cspHeader = reportOnly
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

  const baseHeaders: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    // Dev: credentialless so the Mailpit devtools iframe can still load
    "Cross-Origin-Embedder-Policy": dev ? "credentialless" : "require-corp",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "Document-Policy": "js-profiling",
  };

  if (!dev) {
    baseHeaders["Strict-Transport-Security"] = "max-age=31536000";
  }

  if (sentry) {
    baseHeaders["Reporting-Endpoints"] =
      `${REPORTING_ENDPOINT}="${sentry.reportUri}"`;
  }

  return (nonce?: string): Record<string, string> =>
    nonce === undefined
      ? baseHeaders
      : { ...baseHeaders, [cspHeader]: csp.replaceAll(NONCE, nonce) };
};
