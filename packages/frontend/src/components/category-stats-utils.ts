import {
  addMoney,
  compareMoney,
  type Money,
} from "@nihalgonsalves/expenses-shared/money";
import type { CategoryGroup } from "@nihalgonsalves/expenses-shared/types/category-group";

import type { ConvertedTransactionWithSheet } from "../api/use-all-user-transactions";

export type CategoryStat = { category: string; sum: Money };
export type CategoryGroupStat = {
  name: string;
  categories: CategoryStat[];
  sum: Money;
};

const compareCategoryStats = (a: CategoryStat, b: CategoryStat) =>
  compareMoney(a.sum, b.sum);

export const getCategoryStats = (
  transactions: ConvertedTransactionWithSheet[],
  categoryGroups: CategoryGroup[],
) => {
  const sumsByCategory = new Map<string, Money>();

  for (const transaction of transactions) {
    if (transaction.type === "TRANSFER" || !transaction.convertedMoney)
      continue;

    const previous = sumsByCategory.get(transaction.category);
    sumsByCategory.set(
      transaction.category,
      previous
        ? addMoney(previous, transaction.convertedMoney)
        : transaction.convertedMoney,
    );
  }

  const assignedCategories = new Set(
    categoryGroups.flatMap((categoryGroup) => categoryGroup.categories),
  );
  const categoryStats = [...sumsByCategory.entries()].map(
    ([category, sum]) => ({
      category,
      sum,
    }),
  );
  const statsByCategory = new Map(
    categoryStats.map((categoryStat) => [categoryStat.category, categoryStat]),
  );
  const groupStats = categoryGroups
    .map((categoryGroup) => {
      const categories = categoryGroup.categories
        .map((category) => statsByCategory.get(category))
        .filter((category) => category !== undefined)
        .toSorted(compareCategoryStats);
      const [sum, ...remaining] = categories.map(
        ({ sum: categorySum }) => categorySum,
      );

      return sum
        ? {
            name: categoryGroup.name,
            categories,
            sum: remaining.reduce(addMoney, sum),
          }
        : undefined;
    })
    .filter(
      (categoryGroup): categoryGroup is CategoryGroupStat =>
        categoryGroup !== undefined,
    )
    .toSorted((a, b) => compareMoney(a.sum, b.sum));

  const ungrouped = categoryStats
    .filter(({ category }) => !assignedCategories.has(category))
    .toSorted(compareCategoryStats);

  return { groupStats, ungrouped };
};
