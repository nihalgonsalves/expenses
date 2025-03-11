import { describe, expect, it, vi } from "vitest";

import { signJWT, verifyJWT } from "./utils.ts";

const date = Temporal.Instant.from("2023-01-01T00:00:00.000Z");

vi.useFakeTimers();
vi.setSystemTime(new Date(date.epochMilliseconds));

describe("signJWT/verifyJWT", () => {
  it("creates and signs a token", async () => {
    const result = await signJWT(
      { id: "<user-id>" },
      { identity: "<identity>" },
    );
    const verified = await verifyJWT(result, "<identity>");

    expect(verified).toMatchObject({
      payload: {
        aud: "<identity>",
        exp: 1673136000,
        iat: 1672531200,
        iss: "<identity>",
        sub: "<user-id>",
      },
      reissue: false,
    });
  });
});

describe("verifyJWT", () => {
  it("returns reissue=true after 1 hour", async () => {
    const result = await signJWT(
      { id: "<user-id>" },
      { identity: "<identity>" },
    );

    vi.setSystemTime(new Date(date.add({ hours: 1 }).epochMilliseconds));

    expect(await verifyJWT(result, "<identity>")).toMatchObject({
      payload: {
        aud: "<identity>",
        exp: 1673136000,
        iat: 1672531200,
        iss: "<identity>",
        sub: "<user-id>",
      },
      reissue: true,
    });
  });

  it("throws an error for invalid tokens", async () => {
    await expect(
      verifyJWT(
        // @ts-expect-error supposed to be invalid
        "<invalid-token>",
        "<identity>",
      ),
    ).rejects.toThrow("Invalid token");
  });
});
