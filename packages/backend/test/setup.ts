import "temporal-polyfill/global";

import { vi } from "vitest";

vi.stubEnv("VAPID_PRIVATE_KEY", "<private-key>");
vi.stubEnv("VAPID_PUBLIC_KEY", "<public-key>");
