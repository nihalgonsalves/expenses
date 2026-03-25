import { randomUUID } from "crypto";
import fs from "fs/promises";
import { createAuthClient } from "better-auth/client";
import { test as base, type APIRequestContext } from "@playwright/test";
export { expect } from "@playwright/test";
import { type TRPCClient, createTRPCClient, httpLink } from "@trpc/client";

import type { AppRouter } from "@nihalgonsalves/expenses-backend";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { getUserData } from "./misc";

type Fixtures = {
  setup: () => void;
  serverTRPCClient: TRPCClient<AppRouter>;
  createUser: () => Promise<Omit<User, "theme"> & { password: string }>;
  signIn: () => Promise<Omit<User, "theme"> & { password: string }>;
};

declare global {
  var collectIstanbulCoverage: (coverageJSON: string) => void;
  var __coverage__: unknown;
}

const createCompatibleFetch =
  (origin: string, request: APIRequestContext): typeof fetch =>
  async (...args) => {
    let urlString: string;
    let fetchInit: RequestInit | undefined;

    if (args[0] instanceof Request) {
      urlString = args[0].url;
      fetchInit = args[1] ?? args[0];
    } else if (typeof args[0] === "string" || args[0] instanceof URL) {
      urlString = args[0].toString();
      fetchInit = args[1];
    } else {
      throw new Error("Can only handle string, URL, or Request args.");
    }

    const { body, headers, method = "GET" } = fetchInit ?? {};

    const headersObject =
      headers instanceof Headers
        ? Object.fromEntries(headers.entries())
        : Array.isArray(headers)
          ? Object.fromEntries(headers)
          : (headers ?? {});

    const response = await request.fetch(urlString, {
      data: body,
      method,
      headers: { ...headersObject, origin },
    });

    const responseBody = await response.body();
    return new Response(
      new Blob([
        // @ts-expect-error minor type differences
        responseBody,
      ]),
      {
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
      },
    );
  };

export const test = base.extend<Fixtures>({
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

  serverTRPCClient: async ({ request, baseURL }, use) => {
    const client = createTRPCClient<AppRouter>({
      links: [
        httpLink({
          url: new URL("/api/trpc", baseURL),
          // @ts-expect-error minor type differences
          fetch: createCompatibleFetch(baseURL!, request),
        }),
      ],
    });

    await use(client);
  },

  createUser: async ({ request, baseURL }, use) => {
    await use(async () => {
      const { name, email, password } = getUserData();

      const authClient = createAuthClient({
        baseURL: new URL("/api/auth", baseURL).toString(),
      });

      const { data, error } = await authClient.signUp.email(
        {
          name,
          email,
          password,
        },
        {
          customFetchImpl: createCompatibleFetch(baseURL!, request),
        },
      );

      if (error) {
        throw new Error(`Failed to create user: ${error.message}`, {
          cause: error,
        });
      }

      const { id, emailVerified } = data.user;

      return { id, name, email, emailVerified, password };
    });
  },

  signIn: async ({ context, request, createUser }, use) => {
    await use(async () => {
      const { id, name, email, emailVerified, password } = await createUser();

      await context.addCookies((await request.storageState()).cookies);

      return { id, name, email, emailVerified, password };
    });
  },
});
