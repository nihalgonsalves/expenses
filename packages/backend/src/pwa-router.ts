import { Hono } from "hono";

import {
  ZTheme,
  THEME_DEFAULT,
  themeColors,
} from "@nihalgonsalves/expenses-shared/types/theme";

import { config } from "./config.ts";
import type { HonoVariables } from "./app.ts";

/**
 * Server-side router that serves a themed manifest for the PWA
 */

export const makePWARouter = () => {
  const app = new Hono<{ Variables: HonoVariables }>();

  app.get("/manifest.webmanifest", async (c) => {
    const theme = ZTheme.catch(THEME_DEFAULT).parse(
      c.get("context").user?.theme,
    );
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
