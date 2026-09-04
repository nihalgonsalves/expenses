import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { AppError, getInternalError, normalizeAppError } from "./errors.ts";

describe("AppError", () => {
  it("preserves the application code and cause", () => {
    const cause = new Error("database failure");
    const error = new AppError({
      code: "CONFLICT",
      message: "Already exists",
      cause,
    });

    expect(error).toMatchObject({
      name: "AppError",
      message: "Already exists",
      code: "CONFLICT",
    });
    expect(error.cause).toBe(cause);
  });

  it("normalizes unknown errors while preserving the message in development", () => {
    const cause = new Error("database failure");

    expect(getInternalError(cause)).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "database failure",
      cause,
    });
  });

  it("keeps expected errors and normalizes unexpected errors", () => {
    const expected = new AppError({ code: "NOT_FOUND", message: "Missing" });
    const normalizedExpected = normalizeAppError(expected);
    expect(normalizedExpected).toMatchObject({
      code: "NOT_FOUND",
      message: "Missing",
    });
    expect(normalizedExpected.cause).toBeUndefined();
    expect(normalizedExpected.stack).toBeUndefined();

    const cause = new Error("database failure");
    const normalized = normalizeAppError(cause);
    expect(normalized).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "database failure",
    });
    expect(normalized.cause).toBeUndefined();
  });

  it("maps input validation errors to bad requests", () => {
    const normalized = normalizeAppError(
      new ZodError([
        { code: "invalid_type", expected: "string", path: [], message: "x" },
      ]),
    );

    expect(normalized).toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid request",
    });
  });
});
