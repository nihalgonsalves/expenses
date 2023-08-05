import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import type { GroupSheetExpenseListItem } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../../api/trpc';
import { formatCurrency } from '../../utils/money';
import {
  clsxtw,
  getExpenseDescription,
  getGroupSheetExpenseSummaryText,
  groupBySpentAt,
  shortDateFormatter,
} from '../../utils/utils';
import { Avatar } from '../Avatar';
import { CategoryAvatar } from '../CategoryAvatar';
import { ExpandMoreButton } from '../ExpandMoreButton';
import { ExpenseActions } from '../ExpenseActions';

import { ParticipantListItem } from './ParticipantListItem';

const ExpandedExpenseListItem = ({
  expense,
  groupSheetId,
}: {
  expense: GroupSheetExpenseListItem;
  groupSheetId: string;
}) => {
  const utils = trpc.useContext();

  const [expanded, setExpanded] = useState(false);

  const descriptionText = getExpenseDescription(expense);

  const title = (
    <>
      <strong>{descriptionText}</strong> {formatCurrency(expense.money)}
    </>
  );

  return (
    <motion.div
      key={expense.id}
      className="card card-bordered"
      layout
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
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
            onBeforeDelete={() => {
              setExpanded(false);
            }}
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
    </motion.div>
  );
};

export const GroupSheetExpensesExpandedList = ({
  groupSheetId,
  expenses,
}: {
  groupSheetId: string;
  expenses: GroupSheetExpenseListItem[];
}) => {
  const groupedByDate = groupBySpentAt(expenses, ({ spentAt }) => spentAt);

  return (
    <div className="flex flex-col gap-4">
      {expenses.length === 0 && <div className="alert">No expenses</div>}
      <AnimatePresence initial={false}>
        {[...groupedByDate.keys()].flatMap((date) => [
          <motion.div
            key={date}
            className="divider"
            layout
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            {shortDateFormatter.format(date)}
          </motion.div>,
          groupedByDate
            .get(date)
            ?.map((expense) => (
              <ExpandedExpenseListItem
                key={expense.id}
                expense={expense}
                groupSheetId={groupSheetId}
              />
            )),
        ])}
      </AnimatePresence>
    </div>
  );
};
