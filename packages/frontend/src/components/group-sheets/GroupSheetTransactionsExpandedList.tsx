import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef, useState } from 'react';

import type { GroupSheetTransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../../api/trpc';
import { collapse, scaleOut } from '../../utils/framer';
import { formatCurrency } from '../../utils/money';
import {
  getTransactionDescription,
  getGroupSheetTransactionSummaryText,
  groupBySpentAt,
  shortDateFormatter,
} from '../../utils/utils';
import { Avatar } from '../Avatar';
import { CategoryAvatar } from '../CategoryAvatar';
import { ExpandMoreButton } from '../ExpandMoreButton';
import { TransactionActions } from '../TransactionActions';

import { ParticipantListItem } from './ParticipantListItem';

const ExpandedTransactionListItem = forwardRef<
  HTMLDivElement,
  {
    transaction: GroupSheetTransactionListItem;
    groupSheetId: string;
  }
>(({ transaction, groupSheetId }, ref) => {
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
      className="card card-bordered"
      {...scaleOut}
    >
      <div tabIndex={0} className="card-body collapse p-4">
        <div className="flex gap-4">
          <CategoryAvatar category={transaction.category} />
          <div className="flex-grow">
            <h2>{title}</h2>
            {getGroupSheetTransactionSummaryText(transaction)}
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

              {transaction.type !== 'TRANSFER' && (
                <>
                  {transaction.participants.map(({ id, name, balance }) => (
                    <ParticipantListItem
                      key={id}
                      avatar={<Avatar name={name} />}
                    >
                      <div>
                        <span className="font-semibold">{name}</span>
                        {balance.actual.amount !== 0 && (
                          <>
                            {transaction.type === 'EXPENSE'
                              ? ' paid '
                              : ' received '}
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
              <TransactionActions
                sheetId={groupSheetId}
                transaction={transaction}
                onDelete={async () => {
                  await Promise.all([
                    utils.transaction.getGroupSheetTransactions.invalidate({
                      groupSheetId,
                    }),
                    utils.transaction.getParticipantSummaries.invalidate(
                      groupSheetId,
                    ),
                  ]);
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

export const GroupSheetTransactionsExpandedList = ({
  groupSheetId,
  transactions,
}: {
  groupSheetId: string;
  transactions: GroupSheetTransactionListItem[];
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
                groupSheetId={groupSheetId}
              />
            )),
        ])}
      </AnimatePresence>
    </div>
  );
};
