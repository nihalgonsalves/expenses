// @vitest-environment happy-dom

import { describe, it, expect } from "vitest";

import { formatDraftMoney } from "./money";

describe("formatDraftMoney", () => {
  it("formats with the currency if it is supported", () => {
    expect(
      formatDraftMoney({ amount: 1234, scale: 2, currencyCode: "EUR" }),
    ).toMatch(/12[.,]34/);
    expect(
      formatDraftMoney({ amount: 1234, scale: 2, currencyCode: "EUR" }),
    ).toContain("€");
  });

  it("falls back to the plain amount without a currency", () => {
    expect(
      formatDraftMoney({ amount: 1234, scale: 2, currencyCode: null }),
    ).toBe("12.34");
  });

  it("appends an unsupported currency code", () => {
    expect(
      formatDraftMoney({ amount: 1250, scale: 2, currencyCode: "XYZ" }),
    ).toBe("12.50 XYZ");
  });
});
