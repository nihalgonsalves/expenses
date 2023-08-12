import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef, useState } from 'react';

import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../../api/trpc';
import { collapse, scaleOut } from '../../utils/framer';
import { formatCurrency } from '../../utils/money';
import {
  formatDateTimeRelative,
  getTransactionDescription,
  groupBySpentAt,
  shortDateFormatter,
} from '../../utils/utils';
import { CategoryAvatar } from '../CategoryAvatar';
import { ExpandMoreButton } from '../ExpandMoreButton';
import { TransactionActions } from '../TransactionActions';

const ExpandedTransactionListItem = forwardRef<
  HTMLDivElement,
  {
    transaction: TransactionListItem;
    personalSheetId: string;
  }
>(({ transaction, personalSheetId }, ref) => {
  const utils = trpc.useContext();

  const [expanded, setExpanded] = useState(false);

  const descriptionText = getTransactionDescription(transaction);

  const title = (
    <>
      <strong>{descriptionText}</strong> {formatCurrency(transaction.money)}
    </>
  );

  return (
    <motion.div
      ref={ref}
      key={transaction.id}
      {...scaleOut}
      className="card card-bordered"
    >
      <div tabIndex={0} className="card-body p-4">
        <div className="flex gap-4">
          <CategoryAvatar category={transaction.category} />
          <div className="flex-grow">
            <h2>{title}</h2>
            {formatDateTimeRelative(transaction.spentAt)}
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

              <TransactionActions
                sheetId={personalSheetId}
                transaction={transaction}
                onDelete={async () => {
                  await utils.transaction.getPersonalSheetTransactions.invalidate(
                    {
                      personalSheetId,
                    },
                  );
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
ExpandedTransactionListItem.displayName = 'ExpandedTransactionListItem';

export const PersonalSheetTransactionsExpandedList = ({
  personalSheetId,
  transactions,
}: {
  personalSheetId: string;
  transactions: TransactionListItem[];
}) => {
  const groupedByDate = groupBySpentAt(transactions, ({ spentAt }) => spentAt);

  return (
    <div className="flex flex-col gap-4">
      {transactions.length === 0 && (
        <div className="alert">No transactions</div>
      )}
      <AnimatePresence mode="popLayout" initial={false}>
        {[...groupedByDate.keys()].flatMap((date) => [
          <motion.div key={date} className="divider" {...scaleOut}>
            {shortDateFormatter.format(date)}
          </motion.div>,
          groupedByDate
            .get(date)
            ?.map((transaction) => (
              <ExpandedTransactionListItem
                key={transaction.id}
                transaction={transaction}
                personalSheetId={personalSheetId}
              />
            )),
        ])}
      </AnimatePresence>
    </div>
  );
};
