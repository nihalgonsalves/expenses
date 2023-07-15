import { vi } from 'vitest';

// must match `bin/bundle.mjs` and `globals.d.ts`
vi.stubGlobal('IS_PROD', false);
