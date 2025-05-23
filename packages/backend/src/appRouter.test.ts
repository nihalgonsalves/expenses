import { describe, expect, it } from "vitest";

import { getTRPCCaller } from "../test/getTRPCCaller.ts";

const { usePublicCaller } = await getTRPCCaller();

describe("router", () => {
  describe("health", () => {
    it("should respond with OK", async () => {
      const caller = usePublicCaller();

      await expect(caller.health()).resolves.toStrictEqual({
        status: "ok",
        message: "healthy",
      });
    });
  });
});
