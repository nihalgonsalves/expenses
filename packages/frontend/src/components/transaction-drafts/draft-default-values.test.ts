// @vitest-environment happy-dom

import { describe, it, expect } from "vitest";

import type { TransactionDraft } from "@nihalgonsalves/expenses-shared/types/transaction-draft";

import {
  getDraftDefaultValues,
  getDraftTransactionType,
} from "./draft-default-values";

const draft = (money: TransactionDraft["money"]): TransactionDraft => ({
  id: "draft",
  source: "APPLE_WALLET",
  description: "Lidl",
  money,
  spentAt: "2026-10-24T10:15:30.000Z",
  rawInput: {},
});

describe("getDraftTransactionType", () => {
  it("defaults to an expense", () => {
    expect(getDraftTransactionType(undefined)).toBe("EXPENSE");
    expect(getDraftTransactionType(draft(null))).toBe("EXPENSE");
    expect(
      getDraftTransactionType(
        draft({ amount: 500, scale: 2, currencyCode: "EUR" }),
      ),
    ).toBe("EXPENSE");
  });

  it("returns income for negative amounts", () => {
    expect(
      getDraftTransactionType(
        draft({ amount: -500, scale: 2, currencyCode: "EUR" }),
      ),
    ).toBe("INCOME");
  });
});

describe("getDraftDefaultValues", () => {
  it("uses the absolute amount", () => {
    expect(
      getDraftDefaultValues(
        draft({ amount: -500, scale: 2, currencyCode: "EUR" }),
        "GBP",
      ),
    ).toMatchObject({ amount: 500, currencyCode: "EUR", description: "Lidl" });
  });

  it("rescales to the currency's exponent", () => {
    expect(
      getDraftDefaultValues(
        draft({ amount: 12, scale: 0, currencyCode: "EUR" }),
        "GBP",
      ),
    ).toMatchObject({ amount: 1200 });
    expect(
      getDraftDefaultValues(
        draft({ amount: 1200, scale: 2, currencyCode: "JPY" }),
        "GBP",
      ),
    ).toMatchObject({ amount: 12 });
  });

  it("falls back to the given currency", () => {
    expect(
      getDraftDefaultValues(
        draft({ amount: 1250, scale: 2, currencyCode: null }),
        "GBP",
      ),
    ).toMatchObject({ amount: 1250, currencyCode: "GBP" });
    expect(getDraftDefaultValues(draft(null), "GBP")).toMatchObject({
      amount: 0,
      currencyCode: "GBP",
    });
  });

  it("falls back to the given currency if the draft's is unsupported", () => {
    expect(
      getDraftDefaultValues(
        draft({ amount: 1250, scale: 2, currencyCode: "XYZ" }),
        "GBP",
      ),
    ).toMatchObject({ amount: 1250, currencyCode: "GBP" });
  });

  it("formats the date for a datetime-local input", () => {
    expect(getDraftDefaultValues(draft(null), "GBP").dateTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/,
    );
  });
});
