import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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
      manifest: {
        name: 'Expenses',
        short_name: 'Expenses',
        description: 'Expenses App',
        theme_color: '#1B065E',
        // prettier-ignore
        icons: [
          { src: '/assets/favicon.ico', type: 'image/x-icon', sizes: '16x16 32x32' },
          { src: '/assets/icon-192.png', type: 'image/png', sizes: '192x192' },
          { src: '/assets/icon-512.png', type: 'image/png', sizes: '512x512' },
          { src: '/assets/icon-192-maskable.png', type: 'image/png', sizes: '192x192', purpose: 'maskable' },
          { src: '/assets/icon-512-maskable.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
        ],
      },
    }),
  ],
}));
