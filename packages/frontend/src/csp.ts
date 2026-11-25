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

const NON_DOCUMENT_CSP = serialize({
  "default-src": ["'none'"],
  "frame-ancestors": ["'none'"],
});

const NONCE = "{nonce}";
const REPORTING_ENDPOINT = "csp-endpoint";

type SecurityHeadersOptions = {
  dev: boolean;
  sentryDsn: string | undefined;
  environment: string;
  release: string;
  reportOnly: boolean;
  trustedTypes: boolean;
};

/**
 * Builds the headers once; the returned function only fills in the nonce.
 * Without a nonce (non-document responses), a lockdown CSP is used instead.
 */
export const createSecurityHeaders = ({
  dev,
  sentryDsn,
  environment,
  release,
  reportOnly,
  trustedTypes,
}: SecurityHeadersOptions) => {
  const sentry = parseSentryDsn(sentryDsn);
  const reportTo = sentry ? [REPORTING_ENDPOINT] : undefined;

  const csp = serialize({
    "default-src": ["'self'"],
    // Dev: Vite HMR/React refresh need these; a nonce would disable unsafe-inline
    "script-src": dev
      ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'report-sample'"]
      : [`'nonce-${NONCE}'`, "'strict-dynamic'", "'report-sample'"],
    "style-src-elem": [
      "'self'",
      dev ? "'unsafe-inline'" : `'nonce-${NONCE}'`,
      "'report-sample'",
    ],
    // Nonces can't cover style="" attributes from SSR'd UI libraries
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": dev ? ["'self'", "data:"] : undefined, // jotai-devtools
    "connect-src": [
      "'self'",
      ...(sentry ? [sentry.origin] : []),
      ...(dev ? ["ws:", "wss:"] : []),
    ],
    // Explicit, or it would fall back to script-src with strict-dynamic and break workers
    "worker-src": ["'self'"],
    "frame-src": dev ? ["http://*:8025"] : undefined, // Mailpit
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": dev ? undefined : [],
    "require-trusted-types-for": trustedTypes ? ["'script'"] : undefined,
    "trusted-types": trustedTypes
      ? [
          "default",
          // pwa-install
          "lit-html",
        ]
      : undefined,
    "report-to": reportTo,
  });

  const cspHeader = reportOnly
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

  const baseHeaders: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "display-capture=()",
      "payment=()",
      "usb=()",
      "serial=()",
      "hid=()",
      "bluetooth=()",
      "browsing-topics=()",
      // Passkeys
      "publickey-credentials-get=(self)",
      "publickey-credentials-create=(self)",
    ].join(", "),
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
      `${REPORTING_ENDPOINT}="${sentry.reportUri}&${new URLSearchParams({
        sentry_environment: environment,
        sentry_release: release,
      })}"`;
  }

  const nonDocumentHeaders = {
    ...baseHeaders,
    [cspHeader]: NON_DOCUMENT_CSP,
  };

  return (nonce?: string): Record<string, string> =>
    nonce === undefined
      ? nonDocumentHeaders
      : {
          ...baseHeaders,
          [cspHeader]: csp.replaceAll(NONCE, nonce),
          // Per-request nonce and user data: never store
          "Cache-Control": "no-store",
        };
};
