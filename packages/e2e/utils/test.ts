import { randomUUID } from "crypto";
import fs from "fs/promises";
import { test as base, type BrowserContext } from "@playwright/test";
export { expect } from "@playwright/test";

import { makeCreateContext } from "@nihalgonsalves/expenses-backend/src/context.ts";
import {
  closeBackendRuntime,
  createBackendWebRuntime,
} from "@nihalgonsalves/expenses-backend/src/runtime.ts";
import * as sheetApi from "@nihalgonsalves/expenses-backend/src/service/sheet/sheet-api.server.ts";
import * as userApi from "@nihalgonsalves/expenses-backend/src/service/user/user-api.server.ts";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { getUserData } from "./misc";

type Fixtures = {
  setup: () => void;
  createUser: () => Promise<Omit<User, "theme">>;
  signIn: () => Promise<Omit<User, "theme">>;
};

type WorkerFixtures = {
  backendSheets: {
    createTestUser: (input: { name: string; email: string }) => Promise<{
      user: Omit<User, "theme">;
      cookies: Parameters<BrowserContext["addCookies"]>[0];
    }>;
    createPersonal: (user: Omit<User, "theme">) => Promise<{ id: string }>;
    createGroup: (user: Omit<User, "theme">) => Promise<{ id: string }>;
  };
};

declare global {
  var collectIstanbulCoverage: (coverageJSON: string) => void;
  var __coverage__: unknown;
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  page: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page);
    page.goto = async (...args) =>
      originalGoto(...args).then(async (result) => {
        await page.waitForSelector("body[data-hydrated]");
        return result;
      });
    await use(page);
  },

  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      window.addEventListener("beforeunload", () => {
        globalThis.collectIstanbulCoverage(
          JSON.stringify(globalThis.__coverage__),
        );
      });
    });

    await fs.mkdir(new URL("../coverage/", import.meta.url), {
      recursive: true,
    });

    await context.exposeFunction(
      "collectIstanbulCoverage",
      async (coverageJSON: string) => {
        if (coverageJSON)
          await fs.writeFile(
            new URL(
              `../coverage/playwright_coverage_${randomUUID()}.json`,
              import.meta.url,
            ),
            coverageJSON,
          );
      },
    );

    await use(context);

    await Promise.all(
      context.pages().map(async (page) =>
        page.evaluate(async () => {
          globalThis.collectIstanbulCoverage(
            JSON.stringify(globalThis.__coverage__),
          );
        }),
      ),
    );
  },

  setup: [
    async ({ page }, use) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await use(() => {
        // noop
      });
    },
    { auto: true },
  ],

  backendSheets: [
    // First argument must use the object destructuring pattern: _fixtures
    // oxlint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const runtime = await createBackendWebRuntime();
      const createContext = makeCreateContext(runtime.prisma, runtime.services);
      const contextFor = async (user: Omit<User, "theme">) => ({
        ...(await createContext({
          req: new Request("http://localhost:5173"),
          resHeaders: new Headers(),
        })),
        user: { ...user, theme: null },
      });

      await use({
        createTestUser: async (input) =>
          userApi.createTestUser(
            await createContext({
              req: new Request("http://localhost:5173"),
              resHeaders: new Headers(),
            }),
            input,
          ),
        createPersonal: async (user) =>
          sheetApi.createPersonalSheet(await contextFor(user), {
            name: "Test Sheet",
            currencyCode: "EUR",
          }),
        createGroup: async (user) =>
          sheetApi.createGroupSheet(await contextFor(user), {
            name: "Test Sheet",
            currencyCode: "EUR",
          }),
      });
      await closeBackendRuntime(runtime);
    },
    { scope: "worker" },
  ],

  createUser: async ({ backendSheets }, use) => {
    await use(async () => {
      const { name, email } = getUserData();

      const { user } = await backendSheets.createTestUser({
        name,
        email,
      });

      return user;
    });
  },

  signIn: async ({ page, backendSheets }, use) => {
    await use(async () => {
      const { name, email } = getUserData();

      const { user, cookies } = await backendSheets.createTestUser({
        name,
        email,
      });

      await page.context().addCookies(cookies);

      return user;
    });
  },
});
