import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef, useState } from 'react';

import type { ExpenseListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { ExpenseActions } from '.././ExpenseActions';
import { trpc } from '../../api/trpc';
import { collapse, scaleOut } from '../../utils/framer';
import { formatCurrency } from '../../utils/money';
import {
  formatDateTimeRelative,
  getExpenseDescription,
  groupBySpentAt,
  shortDateFormatter,
} from '../../utils/utils';
import { CategoryAvatar } from '../CategoryAvatar';
import { ExpandMoreButton } from '../ExpandMoreButton';

const ExpandedExpenseListItem = forwardRef<
  HTMLDivElement,
  {
    expense: ExpenseListItem;
    personalSheetId: string;
  }
>(({ expense, personalSheetId }, ref) => {
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
      {...scaleOut}
      className="card card-bordered"
    >
      <div tabIndex={0} className="card-body p-4">
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

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div className="flex flex-col gap-4 p-0" {...collapse}>
              <div className="divider mb-0" />

              <ExpenseActions
                sheetId={personalSheetId}
                expense={expense}
                onDelete={async () => {
                  await utils.expense.getPersonalSheetExpenses.invalidate({
                    personalSheetId,
                  });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
ExpandedExpenseListItem.displayName = 'ExpandedExpenseListItem';

export const PersonalSheetExpensesExpandedList = ({
  personalSheetId,
  expenses,
}: {
  personalSheetId: string;
  expenses: ExpenseListItem[];
}) => {
  const groupedByDate = groupBySpentAt(expenses, ({ spentAt }) => spentAt);

  return (
    <div className="flex flex-col gap-4">
      {expenses.length === 0 && <div className="alert">No expenses</div>}
      <AnimatePresence mode="popLayout" initial={false}>
        {[...groupedByDate.keys()].flatMap((date) => [
          <motion.div key={date} className="divider" {...scaleOut}>
            {shortDateFormatter.format(date)}
          </motion.div>,
          groupedByDate
            .get(date)
            ?.map((expense) => (
              <ExpandedExpenseListItem
                key={expense.id}
                expense={expense}
                personalSheetId={personalSheetId}
              />
            )),
        ])}
      </AnimatePresence>
    </div>
  );
};
