import cookie from "cookie";
import { vi, describe, it, expect } from "vitest";

import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { AUTH_COOKIE_NAME, getMaybeUser } from "./context.ts";
import { UserServiceError } from "./service/user/utils.ts";
import { noopAsync } from "./utils/noop.ts";

describe("getMaybeUser", () => {
  it("exchanges a cookie header token for a user", async () => {
    const setJwtToken =
      vi.fn<(value: string | null) => Promise<void>>(noopAsync);

    const result = await getMaybeUser(
      cookie.serialize(AUTH_COOKIE_NAME, "<jwt-token>"),
      setJwtToken,
      {
        exchangeToken: async (token) => ({
          user: {
            id: "id",
            name: `name (${token})`,
            email: "email@example.com",
            emailVerified: false,
            theme: null,
          },
          payload: {},
          newToken: undefined,
        }),
      },
    );

    expect(result).toStrictEqual({
      id: "id",
      name: "name (<jwt-token>)",
      email: "email@example.com",
      emailVerified: false,
      theme: null,
    } satisfies User);
  });

  it("clears token on auth error", async () => {
    const setJwtToken =
      vi.fn<(value: string | null) => Promise<void>>(noopAsync);

    await expect(
      getMaybeUser(
        cookie.serialize(AUTH_COOKIE_NAME, "<jwt-token>"),
        setJwtToken,
        {
          exchangeToken: async () =>
            Promise.reject(
              new UserServiceError({
                code: "FORBIDDEN",
              }),
            ),
        },
      ),
    ).rejects.toThrowError("FORBIDDEN");

    expect(setJwtToken).toHaveBeenCalledWith(null);
  });

  it("rethrows without clearing token on generic error", async () => {
    const setJwtToken =
      vi.fn<(value: string | null) => Promise<void>>(noopAsync);

    await expect(
      getMaybeUser(
        cookie.serialize(AUTH_COOKIE_NAME, "<jwt-token>"),
        setJwtToken,
        {
          exchangeToken: async () => Promise.reject(new Error("Error")),
        },
      ),
    ).rejects.toThrowError("Error");

    expect(setJwtToken).not.toHaveBeenCalled();
  });

  it("sets a reissued token", async () => {
    const setJwtToken =
      vi.fn<(value: string | null) => Promise<void>>(noopAsync);

    await getMaybeUser(
      cookie.serialize(AUTH_COOKIE_NAME, "<jwt-token>"),
      setJwtToken,
      {
        exchangeToken: async (token) =>
          // @ts-expect-error mock
          ({
            user: {
              id: "id",
              name: `name (${token})`,
              email: "email",
            },
            newToken: "<new-jwt-token>",
          }),
      },
    );

    expect(setJwtToken).toHaveBeenCalledWith("<new-jwt-token>");
  });
});
