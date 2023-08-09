import { MdListAlt } from 'react-icons/md';
import { Link } from 'react-router-dom';

import type { ExpenseListItem } from '@nihalgonsalves/expenses-shared/types/expense';
import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';

import { trpc } from '../../api/trpc';
import { formatCurrency } from '../../utils/money';
import {
  formatDateTimeRelative,
  getExpenseDescription,
} from '../../utils/utils';
import { CategoryAvatar } from '../CategoryAvatar';

const ExpenseListItemComponent = ({
  expense,
}: {
  expense: ExpenseListItem;
}) => {
  const descriptionText = getExpenseDescription(expense);
  return (
    <div className="flex flex-row gap-4 text-sm">
      <CategoryAvatar category={expense.category} />
      <div className="flex flex-col">
        <span>
          <strong>{descriptionText}</strong> {formatCurrency(expense.money)}
        </span>
        <span>{formatDateTimeRelative(expense.spentAt)}</span>
      </div>
    </div>
  );
};

export const PersonalSheet = ({ personalSheet }: { personalSheet: Sheet }) => {
  const { data: personalSheetExpensesResponse } =
    trpc.expense.getPersonalSheetExpenses.useQuery({
      personalSheetId: personalSheet.id,
    });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Latest Expenses</h2>

      {personalSheetExpensesResponse?.expenses
        .slice(0, 4)
        .map((expense) => (
          <ExpenseListItemComponent key={expense.id} expense={expense} />
        ))}

      <Link
        to={`/sheets/${personalSheet.id}/expenses`}
        className="btn btn-primary btn-outline "
      >
        <MdListAlt /> All Expenses ({personalSheetExpensesResponse?.total})
      </Link>
    </div>
  );
};
