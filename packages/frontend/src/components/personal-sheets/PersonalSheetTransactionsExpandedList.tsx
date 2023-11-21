import { Temporal } from '@js-temporal/polyfill';
import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef, useState } from 'react';
import { MdEdit } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { sumMoneyOrUndefined } from '@nihalgonsalves/expenses-shared/money';
import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../../api/trpc';
import { collapse, scaleOut } from '../../utils/framer';
import { formatCurrency } from '../../utils/money';
import {
  formatDateRelative,
  formatDateTimeRelative,
  getTransactionDescription,
  groupBySpentAt,
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
  const utils = trpc.useUtils();

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

              <Link
                to={`/sheets/${personalSheetId}/transactions/${transaction.id}`}
                className="btn btn-outline btn-block"
              >
                <MdEdit /> Edit
              </Link>

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
        {[...groupedByDate.keys()].flatMap((date) => {
          const dateTransactions = groupedByDate.get(date) ?? [];
          const sum = sumMoneyOrUndefined(
            dateTransactions.map(({ money }) => money),
          );

          return [
            <motion.div
              key={date}
              className="flex items-center gap-4 px-2"
              {...scaleOut}
            >
              {formatDateRelative(Temporal.Instant.fromEpochMilliseconds(date))}
              <div className="divider flex-grow relative top-[1.5px]" />
              {sum ? formatCurrency(sum) : '–'}
            </motion.div>,
            dateTransactions.map((transaction) => (
              <ExpandedTransactionListItem
                key={transaction.id}
                transaction={transaction}
                personalSheetId={personalSheetId}
              />
            )),
          ];
        })}
      </AnimatePresence>
    </div>
  );
};
