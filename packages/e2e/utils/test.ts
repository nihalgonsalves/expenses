import fs from "fs/promises";
import { fileURLToPath } from "url";

import { test as base } from "@playwright/test";
import {
  type CreateTRPCProxyClient,
  createTRPCProxyClient,
  httpBatchLink,
} from "@trpc/client";
import { nanoid } from "nanoid";

import type { AppRouter } from "@nihalgonsalves/expenses-backend";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { getUserData } from "./misc";

type Fixtures = {
  setup: () => void;
  serverTRPCClient: CreateTRPCProxyClient<AppRouter>;
  createUser: () => Promise<User & { password: string }>;
  signIn: () => Promise<User & { password: string }>;
};

const relativePath = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url).toString());

declare global {
  /* eslint-disable no-var, @typescript-eslint/naming-convention */
  var collectIstanbulCoverage: (coverageJSON: string) => void;
  var __coverage__: unknown;
  /* eslint-enable */
}

export const test = base.extend<Fixtures>({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      window.addEventListener("beforeunload", () => {
        globalThis.collectIstanbulCoverage(
          JSON.stringify(globalThis.__coverage__),
        );
      });
    });

    await fs.mkdir(relativePath("../coverage/"), { recursive: true });

    await context.exposeFunction(
      "collectIstanbulCoverage",
      async (coverageJSON: string) => {
        if (coverageJSON)
          await fs.writeFile(
            relativePath(`../coverage/playwright_coverage_${nanoid()}.json`),
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
    const client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: new URL("/api/trpc", baseURL),
          // @ts-expect-error we're not handling theunion member body: ... | () => Promise<Buffer>
          fetch: async (input, { headers, body, ...init } = {}) => {
            if (typeof input === "string") {
              const response = await request.fetch(input, {
                ...init,
                data: body,
                headers: Array.isArray(headers)
                  ? Object.fromEntries(headers)
                  : // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                    (headers as Record<string, string>),
              });

              return response;
            }

            throw new Error("Can't handle non-string input");
          },
        }),
      ],
    });

    await use(client);
  },

  createUser: async ({ serverTRPCClient }, use) => {
    await use(async () => {
      const { name, email, password } = getUserData();

      const { id, emailVerified, theme } =
        await serverTRPCClient.user.createUser.mutate({
          name,
          email,
          password,
        });

      return { id, name, email, emailVerified, password, theme };
    });
  },

  signIn: async ({ context, request, createUser }, use) => {
    await use(async () => {
      const { id, name, email, emailVerified, password, theme } =
        await createUser();

      await context.addCookies((await request.storageState()).cookies);

      return { id, name, email, emailVerified, password, theme };
    });
  },
});

export { expect } from "@playwright/test";
