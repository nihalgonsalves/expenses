import { useState } from 'react';

import { type ExpenseListItem } from '@nihalgonsalves/expenses-backend';

import { ExpenseActions } from '.././ExpenseActions';
import { trpc } from '../../api/trpc';
import { formatCurrency } from '../../utils/money';
import {
  clsxtw,
  formatDateTimeRelative,
  getExpenseDescription,
} from '../../utils/utils';
import { CategoryAvatar } from '../CategoryAvatar';
import { ExpandMoreButton } from '../ExpandMoreButton';

const ExpandedExpenseListItem = ({
  expense,
  personalSheetId,
}: {
  expense: ExpenseListItem;
  personalSheetId: string;
}) => {
  const utils = trpc.useContext();

  const [isInvalidating, setIsInvalidating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const descriptionText = getExpenseDescription(expense);

  const title = (
    <>
      <strong>{descriptionText}</strong> {formatCurrency(expense.money)}
    </>
  );

  return (
    <div
      className={clsxtw('card card-bordered', {
        'opacity-50': isInvalidating,
      })}
    >
      <div
        tabIndex={0}
        className={clsxtw(
          'card-body collapse p-4',
          expanded ? 'collapse-open' : 'collapse-close',
        )}
      >
        <div className="flex gap-4">
          <CategoryAvatar category={expense.category} />
          <div className="flex-grow">
            <h2>{title}</h2>
            {formatDateTimeRelative(expense.spentAt)}
          </div>
          <ExpandMoreButton
            expand={expanded}
            onClick={() => {
              setExpanded((prev) => !prev);
            }}
          />
        </div>

        <div className="collapse-content flex flex-col gap-4 p-0">
          <div className="divider mb-0" />

          <ExpenseActions
            sheetId={personalSheetId}
            expense={expense}
            setIsInvalidating={setIsInvalidating}
            onDelete={async () => {
              await utils.expense.getPersonalSheetExpenses.invalidate({
                personalSheetId,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const PersonalSheetExpensesExpandedList = ({
  personalSheetId,
  expenses,
}: {
  personalSheetId: string;
  expenses: ExpenseListItem[];
}) => {
  return (
    <div className="flex flex-col gap-4">
      {expenses.length === 0 && <div className="alert">No expenses</div>}
      {expenses.map((expense) => (
        <ExpandedExpenseListItem
          key={expense.id}
          expense={expense}
          personalSheetId={personalSheetId}
        />
      ))}
    </div>
  );
};
