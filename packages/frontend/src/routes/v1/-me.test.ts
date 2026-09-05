import { describe, expect, it } from "vitest";

import { getV1Me, getV1MeResponse } from "./me";

describe("getV1Me", () => {
  it("returns 401 when the request has no API key", async () => {
    const response = await getV1Me(new Request("https://expenses.test/v1/me"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toStrictEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });

  it("returns the authenticated user's public fields", async () => {
    const response = getV1MeResponse(
      {
        id: "user-123",
        name: "Ada Lovelace",
        email: "ada@example.com",
        theme: null,
      },
      new Headers(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.json()).resolves.toStrictEqual({
      id: "user-123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      theme: null,
    });
  });
});
