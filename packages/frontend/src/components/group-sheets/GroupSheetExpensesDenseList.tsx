import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef } from 'react';

import type { GroupSheetExpenseListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { formatCurrency } from '../../utils/money';
import {
  getExpenseDescription,
  getGroupSheetExpenseSummaryText,
} from '../../utils/utils';
import { AvatarGroup } from '../Avatar';
import { CategoryAvatar } from '../CategoryAvatar';

const DenseExpenseListItem = forwardRef<
  HTMLDivElement,
  {
    expense: GroupSheetExpenseListItem;
  }
>(({ expense }, ref) => {
  const descriptionText = getExpenseDescription(expense);

  return (
    <motion.div
      ref={ref}
      key={expense.id}
      className="flex flex-row items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <CategoryAvatar category={expense.category} />
      <div>
        <strong>{descriptionText}</strong> {formatCurrency(expense.money)}
        <span
          className="inline-block text-gray-500"
          style={{
            overflow: 'hidden',
            // non-standard but does work in all browsers, should
            // be replaced with `lineClamp` eventually
            // https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp
            // https://drafts.csswg.org/css-overflow-4/#propdef-line-clamp
            display: '-webkit-box',
            WebkitLineClamp: '1',
            WebkitBoxOrient: 'vertical',
          }}
        >
          {getGroupSheetExpenseSummaryText(expense)}
        </span>
      </div>
      <div style={{ flexGrow: 1 }} />
      <AvatarGroup
        className="-space-x-6"
        max={5}
        names={expense.participants.map(({ name }) => name)}
      ></AvatarGroup>
    </motion.div>
  );
});
DenseExpenseListItem.displayName = 'DenseExpenseListItem';

export const GroupSheetExpensesDenseList = ({
  expenses,
}: {
  expenses: GroupSheetExpenseListItem[];
}) => (
  <div className="flex flex-col gap-4">
    <AnimatePresence mode="popLayout" initial={false}>
      {expenses.map((expense) => (
        <DenseExpenseListItem key={expense.id} expense={expense} />
      ))}
    </AnimatePresence>
  </div>
);
