import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: { enabled: true, reporter: ['html'] },
    setupFiles: fileURLToPath(new URL('./test/setup.ts', import.meta.url)),
    exclude: ['**/build/**/*', '**/dist/**/*'],
  },
});
