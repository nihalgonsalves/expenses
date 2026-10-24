import { describe, expect, it } from "vitest";

import { getV1Me, getV1MeResponse } from "./me";

describe("getV1Me", () => {
  it("returns 401 when the request has no API key", async () => {
    const response = await getV1Me(new Request("https://expenses.test/v1/me"));

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Content-Type")).toBe(
      "application/problem+json",
    );
    expect(response.headers.get("WWW-Authenticate")).toBe("Bearer");
    await expect(response.json()).resolves.toStrictEqual({
      title: "Unauthorized",
      status: 401,
      detail: "A valid API key is required",
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
    await expect(response.json()).resolves.toStrictEqual({
      id: "user-123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      theme: null,
    });
  });
});
