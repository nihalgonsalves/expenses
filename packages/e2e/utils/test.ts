import { test as base, expect } from '@playwright/test';
import {
  type CreateTRPCProxyClient,
  createTRPCProxyClient,
  httpBatchLink,
} from '@trpc/client';

import type { AppRouter } from '@nihalgonsalves/expenses-backend';
import type { User } from '@nihalgonsalves/expenses-shared/types/user';

import { getUserData } from './misc';

type Fixtures = {
  serverTRPCClient: CreateTRPCProxyClient<AppRouter>;
  createUser: () => Promise<User & { password: string }>;
  signIn: () => Promise<User & { password: string }>;
};

export const test = base.extend<Fixtures>({
  serverTRPCClient: async ({ request, baseURL }, use) => {
    const client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: new URL('/api/trpc', baseURL),
          // @ts-expect-error we're not handling theunion member body: ... | () => Promise<Buffer>
          fetch: async (input, { headers, body, ...init } = {}) => {
            if (typeof input === 'string') {
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

      const { id } = await serverTRPCClient.user.createUser.mutate({
        name,
        email,
        password,
      });

      return { id, name, email, password };
    });
  },

  // TODO: this should automatically set cookies instead of using the form on each run
  signIn: async ({ page, createUser }, use) => {
    await use(async () => {
      const { id, name, email, password } = await createUser();

      await page.goto('/auth/sign-in');

      await expect(page).toHaveTitle(/sign in/i);

      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole('button', { name: /sign in/i }).click();

      return { id, name, email, password };
    });
  },
});

export { expect } from '@playwright/test';