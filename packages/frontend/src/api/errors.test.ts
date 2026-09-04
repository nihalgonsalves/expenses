import { describe, expect, it } from "vitest";

import { getAppErrorCode, isNonRetryableAppError } from "./errors";

describe("server function errors", () => {
  it("reads the code from a serialized application error", () => {
    expect(
      getAppErrorCode({ message: "Sheet not found", code: "NOT_FOUND" }),
    ).toBe("NOT_FOUND");
    expect(
      getAppErrorCode({
        message: "Sheet not found",
        data: { code: "NOT_FOUND" },
      }),
    ).toBe("NOT_FOUND");
  });

  it("does not retry application errors caused by the request", () => {
    expect(isNonRetryableAppError({ code: "BAD_REQUEST" })).toBe(true);
    expect(isNonRetryableAppError({ code: "CONFLICT" })).toBe(true);
    expect(isNonRetryableAppError({ code: "INTERNAL_SERVER_ERROR" })).toBe(
      false,
    );
    expect(isNonRetryableAppError(new Error("network failure"))).toBe(false);
  });
});
