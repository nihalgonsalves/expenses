import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import IstanbulPlugin from 'vite-plugin-istanbul';

const relativePath = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url).toString());

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: null,
      strategies: 'injectManifest',
      selfDestroying:
        mode === 'development' && process.env.ENABLE_DEV_PWA == null,
      devOptions: {
        enabled: true,
        type: 'module',
        resolveTempFolder: () => relativePath('./dist/vite-pwa-dev/'),
      },
      manifest: false,
    }),
    ...(process.env.VITE_COVERAGE
      ? [
          IstanbulPlugin({
            include: 'src/*',
            exclude: ['node_modules', 'test/'],
            extension: ['.js', '.ts', '.tsx'],
          }),
        ]
      : []),
  ],
}));
