import { describe, expect, it } from "vitest";
import {
  createSecurityHeaders,
  generateNonce,
  parseSentryDsn,
  SERVICE_WORKER_CSP,
} from "./csp";

const DSN = "https://abc123@o1.ingest.us.sentry.io/456";

const headersFor = (
  options: Partial<Parameters<typeof createSecurityHeaders>[0]> = {},
) =>
  createSecurityHeaders({
    dev: false,
    sentryDsn: undefined,
    reportOnly: false,
    ...options,
  });

it("builds the production security headers", () => {
  expect({
    document: headersFor({ sentryDsn: DSN })("abcdef"),
    serviceWorker: SERVICE_WORKER_CSP,
  }).toMatchInlineSnapshot(`
    {
      "document": {
        "Content-Security-Policy": "default-src 'self'; script-src 'nonce-abcdef' 'strict-dynamic'; style-src-elem 'self' 'nonce-abcdef'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://o1.ingest.us.sentry.io; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests; report-to csp-endpoint",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Document-Policy": "js-profiling",
        "Origin-Agent-Cluster": "?1",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Reporting-Endpoints": "csp-endpoint="https://o1.ingest.us.sentry.io/api/456/security/?sentry_key=abc123"",
        "Strict-Transport-Security": "max-age=31536000",
        "X-Content-Type-Options": "nosniff",
      },
      "serviceWorker": "default-src 'self'; object-src 'none'; base-uri 'none'",
    }
  `);
});

describe("parseSentryDsn", () => {
  it("derives the ingest origin and security endpoint", () => {
    expect(parseSentryDsn(DSN)).toStrictEqual({
      origin: "https://o1.ingest.us.sentry.io",
      reportUri:
        "https://o1.ingest.us.sentry.io/api/456/security/?sentry_key=abc123",
    });
  });

  it.each([undefined, "", "not a url", "https://o1.ingest.sentry.io/456"])(
    "returns undefined for %j",
    (dsn) => {
      expect(parseSentryDsn(dsn)).toBeUndefined();
    },
  );
});

describe("createSecurityHeaders", () => {
  it("moves the main policy into the report-only header", () => {
    const enforced = headersFor()("n");
    const reportOnly = headersFor({ reportOnly: true })("n");

    expect(reportOnly["Content-Security-Policy"]).toBeUndefined();
    expect(reportOnly["Content-Security-Policy-Report-Only"]).toBe(
      enforced["Content-Security-Policy"],
    );
  });

  it("fills in a fresh nonce per call", () => {
    const headers = headersFor();

    expect(headers("a")["Content-Security-Policy"]).toContain("'nonce-a'");
    expect(headers("b")["Content-Security-Policy"]).not.toContain("'nonce-a'");
  });

  it("omits the CSP without a nonce", () => {
    expect(headersFor()()).not.toHaveProperty("Content-Security-Policy");
  });

  it("omits reporting without a DSN", () => {
    const headers = headersFor()("n");

    expect(headers).not.toHaveProperty("Reporting-Endpoints");
    expect(Object.values(headers).join()).not.toContain("report-to");
  });

  it("uses neither the nonce nor HSTS in dev", () => {
    const headers = headersFor({ dev: true })("abcdef");

    expect(headers["Content-Security-Policy"]).not.toContain("abcdef");
    expect(headers).not.toHaveProperty("Strict-Transport-Security");
  });
});

it("generates a unique nonce per call", () => {
  expect(generateNonce()).not.toStrictEqual(generateNonce());
});
