import { Hono } from "hono";

import {
  ZTheme,
  THEME_DEFAULT,
  themeColors,
} from "@nihalgonsalves/expenses-shared/types/theme";

import { config } from "./config.ts";
import type { makeCreateContext } from "./context.ts";

/**
 * Server-side router that serves a themed manifest for the PWA
 */

export const makePWARouter = (
  createContext: ReturnType<typeof makeCreateContext>,
) => {
  const app = new Hono();

  app.get("/manifest.webmanifest", async (c) => {
    const context = await createContext({
      req: c.req.raw,
      resHeaders: c.res.headers,
    });

    const theme = ZTheme.catch(THEME_DEFAULT).parse(context.user?.theme);
    const { primary } = themeColors[theme];

    return c.json(
      {
        id: "/",
        name: config.APP_NAME,
        short_name: config.APP_NAME,
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        lang: "en",
        scope: "/",
        description: "Expenses App",
        theme_color: primary,
        icons: [
          {
            src: `/assets/icon-normal-${theme}.svg`,
            type: "image/svg+xml",
            sizes: "any",
            purpose: "any",
          },
          {
            src: `/assets/icon-maskable-${theme}.svg`,
            type: "image/svg+xml",
            sizes: "any",
            purpose: "maskable",
          },
          {
            src: "/assets/icon-monochrome.svg",
            type: "image/svg+xml",
            sizes: "16x16",
            purpose: "monochrome",
          },
        ],
      },
      200,
      {
        "content-type": "application/manifest+json",
      },
    );
  });

  return app;
};
