import "temporal-polyfill/global";

// must match `bin/bundle.mjs` and `globals.d.ts`
globalThis.IS_PROD = false;

process.env["VAPID_PRIVATE_KEY"] = "<private-key>";
process.env["VAPID_PUBLIC_KEY"] = "<public-key>";
