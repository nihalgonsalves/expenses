import "temporal-polyfill/global";

import { vi } from "vitest";

// must match `bin/bundle.js` and `globals.d.ts`
vi.stubGlobal("IS_PROD", false);

vi.stubEnv("VAPID_PRIVATE_KEY", "<private-key>");
vi.stubEnv("VAPID_PUBLIC_KEY", "<public-key>");
