/**
 * Zod probes `new Function`, which is a CSP + Trusted Types violation
 * `z.config()` would import zod, just set what zod sets.
 */
globalThis.__zod_globalConfig = {
  ...globalThis.__zod_globalConfig,
  jitless: true,
};
