import { addMoney, type Money } from '@nihalgonsalves/expenses-shared/money';

import type {
  AllConvertedUserExpenses,
  ConvertedExpenseWithSheet,
} from '../api/useAllUserExpenses';
import { categoryById } from '../data/categories';
import { formatCurrency } from '../utils/money';

const getCategorySums = (data: ConvertedExpenseWithSheet[]) => {
  const categorySums: Record<string, Money> = {};

  data.forEach(({ expense }) => {
    if (!expense.convertedMoney) return;

    const currentSum = categorySums[expense.category];

    categorySums[expense.category] = currentSum
      ? addMoney(currentSum, expense.convertedMoney)
      : expense.convertedMoney;
  });

  return categorySums;
};

export const CategoryStats = ({ data }: { data: AllConvertedUserExpenses }) => {
  const categoryExpenseSums = getCategorySums(data.expenses);
  // const categoryIncomeSums = getCategorySums(data.earnings);

  return (
    <div className="p-4 grid place-items-center">
      <div className="flex">
        <div className="stats stats-vertical shadow">
          {Object.entries(categoryExpenseSums).map(([category, sum]) => (
            <div className="stat" key={category}>
              <div className="stat-figure text-secondary">
                {categoryById[category]?.icon}
              </div>

              <div className="stat-title">{categoryById[category]?.name}</div>
              <div className="stat-value">{formatCurrency(sum)}</div>
              <div className="stat-desc">this month</div>
            </div>
          ))}
        </div>
        {/* <div className="stats stats-vertical shadow">
          {Object.entries(categoryIncomeSums).map(([category, sum]) => (
            <div className="stat" key={category}>
              <div className="stat-figure text-secondary">
                {categoryById[category]?.icon}
              </div>

              <div className="stat-title">{categoryById[category]?.name}</div>
              <div className="stat-value">{formatCurrency(sum)}</div>
              <div className="stat-desc">this month</div>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
};
