import { describe, expect, it } from "vitest";

import type { ConvertedTransactionWithSheet } from "../api/use-all-user-transactions";

import { getCategoryStats } from "./category-stats-utils";

const transaction = (
  category: string,
  amount: number,
  type: "EXPENSE" | "INCOME" | "TRANSFER" = "EXPENSE",
): ConvertedTransactionWithSheet => ({
  id: `${category}-${amount}`,
  category,
  description: "",
  type,
  spentAt: "2026-09-01T00:00:00.000Z",
  money: { amount, scale: 2, currencyCode: "EUR" },
  convertedMoney: { amount, scale: 2, currencyCode: "EUR" },
  sheetType: "PERSONAL",
  sheet: {
    id: "sheet",
    type: "PERSONAL",
    name: "Personal",
    currencyCode: "EUR",
    isArchived: false,
  },
});

describe("getCategoryStats", () => {
  it("nets income and expenses within a category group", () => {
    const stats = getCategoryStats(
      [
        transaction("Eating Out", -10_000),
        transaction("Work Lunch", -3_000),
        transaction("Work Lunch", 2_000, "INCOME"),
        transaction("Health", -4_000),
        transaction("Moving money", 99_000, "TRANSFER"),
      ],
      [
        {
          id: "food",
          name: "Food",
          categories: ["Eating Out", "Work Lunch"],
        },
      ],
    );

    expect(stats.groupStats).toMatchObject([
      {
        name: "Food",
        sum: { amount: -11_000, scale: 2, currencyCode: "EUR" },
        categories: [
          { category: "Eating Out", sum: { amount: -10_000 } },
          { category: "Work Lunch", sum: { amount: -1_000 } },
        ],
      },
    ]);
    expect(stats.ungrouped).toMatchObject([
      { category: "Health", sum: { amount: -4_000 } },
    ]);
  });
});
