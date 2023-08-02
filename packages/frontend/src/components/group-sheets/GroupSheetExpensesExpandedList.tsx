import { Fragment, useState } from 'react';

import { type GroupSheetExpenseListItem } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../../api/trpc';
import { formatCurrency } from '../../utils/money';
import {
  clsxtw,
  getExpenseDescription,
  getGroupSheetExpenseSummaryText,
} from '../../utils/utils';
import { Avatar } from '../Avatar';
import { CategoryAvatar } from '../CategoryAvatar';
import { ExpandMoreButton } from '../ExpandMoreButton';
import { ExpenseActions } from '../ExpenseActions';
import { ParticipantListItem } from '../ParticipantListItem';

const ExpandedExpenseListItem = ({
  expense,
  groupSheetId,
}: {
  expense: GroupSheetExpenseListItem;
  groupSheetId: string;
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
      className={clsxtw('card card-bordered', { 'opacity-50': isInvalidating })}
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
            {getGroupSheetExpenseSummaryText(expense)}
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

          {expense.type === 'EXPENSE' &&
            expense.participants
              .filter(({ balance: { amount } }) => amount !== 0)
              .map(({ id, name, balance }) => (
                <ParticipantListItem key={id} avatar={<Avatar name={name} />}>
                  <span>
                    <span className="font-semibold">{name}</span>
                    <br />
                    {`${
                      balance.amount < 0 ? 'Receives' : 'Owes'
                    } ${formatCurrency(balance, {
                      signDisplay: 'never',
                    })}`}
                  </span>
                </ParticipantListItem>
              ))}

          <div className="divider m-0" />

          <ExpenseActions
            sheetId={groupSheetId}
            expense={expense}
            setIsInvalidating={setIsInvalidating}
            onDelete={async () => {
              await Promise.all([
                utils.expense.getGroupSheetExpenses.invalidate({
                  groupSheetId,
                }),
                utils.expense.getParticipantSummaries.invalidate(groupSheetId),
              ]);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const GroupSheetExpensesExpandedList = ({
  groupSheetId,
  expenses,
}: {
  groupSheetId: string;
  expenses: GroupSheetExpenseListItem[];
}) => {
  return (
    <div className="flex flex-col gap-4">
      {expenses.length === 0 && <div className="alert">No expenses</div>}
      {expenses.map((expense) => (
        <Fragment key={expense.id}>
          <ExpandedExpenseListItem
            expense={expense}
            groupSheetId={groupSheetId}
          />
        </Fragment>
      ))}
    </div>
  );
};
