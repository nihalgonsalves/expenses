import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef, useState } from 'react';

import type { GroupSheetExpenseListItem } from '@nihalgonsalves/expenses-shared/types/expense';

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

const ExpandedExpenseListItem = forwardRef<
  HTMLDivElement,
  {
    expense: GroupSheetExpenseListItem;
    groupSheetId: string;
  }
>(({ expense, groupSheetId }, ref) => {
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
      ref={ref}
      key={expense.id}
      className="card card-bordered"
      layout
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
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

          {expense.type !== 'TRANSFER' && (
            <>
              {expense.participants.map(({ id, name, balance }) => (
                <ParticipantListItem key={id} avatar={<Avatar name={name} />}>
                  <div>
                    <span className="font-semibold">{name}</span>
                    {balance.actual.amount !== 0 && (
                      <>
                        {expense.type === 'EXPENSE' ? ' paid ' : ' received '}
                        <span className="badge badge-primary">
                          {formatCurrency(balance.actual, {
                            signDisplay: 'never',
                          })}
                        </span>
                      </>
                    )}
                    <br />
                    <span className="badge badge-neutral">
                      {formatCurrency(balance.share, {
                        signDisplay: 'never',
                      })}
                    </span>
                  </div>
                </ParticipantListItem>
              ))}

              <div className="divider m-0" />
            </>
          )}
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
});
ExpandedExpenseListItem.displayName = 'ExpandedExpenseListItem';

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
      <AnimatePresence mode="popLayout" initial={false}>
        {[...groupedByDate.keys()].flatMap((date) => [
          <motion.div
            key={date}
            className="divider"
            layout
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
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
