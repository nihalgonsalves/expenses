import { Hono } from 'hono';

import {
  ZTheme,
  THEME_DEFAULT,
  themeColors,
} from '@nihalgonsalves/expenses-shared/types/theme';

import type { makeCreateContext } from './context';

/**
 * Server-side router that serves a themed manifest for the PWA
 */

export const makePWARouter = (
  createContext: ReturnType<typeof makeCreateContext>,
) => {
  const app = new Hono();

  app.get('/manifest.webmanifest', async (c) => {
    const context = await createContext({
      req: c.req.raw,
      resHeaders: c.res.headers,
    });

    const theme = ZTheme.catch(THEME_DEFAULT).parse(context.user?.theme);
    const { primary } = themeColors[theme];

    c.json({
      id: '/',
      name: 'Expenses',
      short_name: 'Expenses',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      lang: 'en',
      scope: '/',
      description: 'Expenses App',
      theme_color: primary,
      icons: [
        ...['any', 'maskable'].map((purpose) => ({
          src: `/assets/icon-normal-${theme}.svg`,
          type: 'image/svg+xml',
          sizes: 'any 512x512',
          purpose,
        })),
        {
          src: `/assets/icon-maskable-${theme}.svg`,
          type: 'image/svg+xml',
          sizes: 'any 512x512 192x192 180x180 120x120',
          purpose: 'maskable',
        },
        {
          src: `/assets/icon-${theme}.png`,
          type: 'image/png',
          sizes: '180x180',
          purpose: 'any',
        },
        {
          src: '/assets/icon-monochrome.svg',
          type: 'image/svg+xml',
          sizes: '16x16',
          purpose: 'monochrome',
        },
      ],
    });
  });

  return app;
};
