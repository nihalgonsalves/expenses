import { motion, AnimatePresence } from 'framer-motion';

import type {
  Sheet,
  ExpenseListItem,
  GetAllUserExpensesResponse,
} from '@nihalgonsalves/expenses-backend';

import { formatCurrency } from '../utils/money';
import { formatDateTimeRelative, getExpenseDescription } from '../utils/utils';

import { CategoryAvatar } from './CategoryAvatar';

const ExpenseRow = ({
  expense,
  sheet,
}: {
  expense: ExpenseListItem;
  sheet: Sheet;
}) => {
  const money = formatCurrency(expense.money, {
    signDisplay: expense.type === 'TRANSFER' ? 'never' : 'always',
  });
  const description = getExpenseDescription(expense);
  const dateTime = formatDateTimeRelative(expense.spentAt);

  return (
    <motion.tr key={expense.id} layout>
      <td>
        <div className="flex items-center gap-4">
          <CategoryAvatar category={expense.category} />
        </div>
      </td>

      <td className="hidden sm:table-cell">
        <strong>{description}</strong>
      </td>
      <td className="hidden sm:table-cell">{dateTime}</td>

      <td className="sm:hidden">
        <strong>{description}</strong>
        <br />
        <em>{dateTime}</em>
        <br />
        {sheet.name}
      </td>

      <td className="text-right">{money}</td>
      <td className="hidden sm:table-cell">{sheet.name}</td>
    </motion.tr>
  );
};

export const AllUserExpensesList = ({
  data,
}: {
  data: GetAllUserExpensesResponse;
}) => (
  <table className="table table-pin-rows">
    <thead>
      <tr>
        <th>Category</th>

        <th className="hidden sm:table-cell">Description</th>
        <th className="hidden sm:table-cell">Date</th>

        <th className="sm:hidden">Details</th>

        <th className="text-right">Amount</th>
        <th className="hidden sm:table-cell">Sheet</th>
      </tr>
    </thead>
    <tbody>
      <AnimatePresence mode="wait">
        {data.expenses.map(({ expense, sheet }) => (
          <ExpenseRow key={expense.id} expense={expense} sheet={sheet} />
        ))}
      </AnimatePresence>
    </tbody>
  </table>
);
