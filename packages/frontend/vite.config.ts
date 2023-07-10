import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'es2022',
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
      injectRegister: false,
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'Expenses',
        short_name: 'Expenses',
        description: 'Expenses App',
        theme_color: '#1877d3',
        icons: [
          {
            src: '/assets/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: '/assets/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/assets/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
