import { Temporal } from '@js-temporal/polyfill';
import { Collapsible } from '@radix-ui/react-collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef, useState } from 'react';

import { sumMoneyOrUndefined } from '@nihalgonsalves/expenses-shared/money';
import type { GroupSheetTransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../../api/trpc';
import { scaleOut } from '../../utils/framer';
import { formatCurrency } from '../../utils/money';
import {
  getTransactionDescription,
  getGroupSheetTransactionSummaryText,
  groupBySpentAt,
  formatDateRelative,
} from '../../utils/utils';
import { Avatar } from '../Avatar';
import { CategoryAvatar } from '../CategoryAvatar';
import { ExpandMoreButton } from '../ExpandMoreButton';
import { TransactionActions } from '../TransactionActions';
import { Alert, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Separator } from '../ui/separator';

import { ParticipantListItem } from './ParticipantListItem';

const MotionCard = motion(Card);

const ExpandedTransactionListItem = forwardRef<
  HTMLDivElement,
  {
    transaction: GroupSheetTransactionListItem;
    groupSheetId: string;
  }
>(({ transaction, groupSheetId }, ref) => {
  const utils = trpc.useUtils();

  const [expanded, setExpanded] = useState(false);

  const descriptionText = getTransactionDescription(transaction);

  const title = (
    <>
      <strong>{descriptionText}</strong> {formatCurrency(transaction.money)}
    </>
  );

  return (
    <MotionCard ref={ref} key={transaction.id} {...scaleOut}>
      <Collapsible open={expanded}>
        <CardHeader className="flex w-full flex-row place-items-center gap-4">
          <CategoryAvatar category={transaction.category} />

          <div className="flex flex-col">
            <span>{title}</span>
            <span>{getGroupSheetTransactionSummaryText(transaction)}</span>
          </div>

          <div className="grow"></div>

          <CollapsibleTrigger>
            <ExpandMoreButton
              expand={expanded}
              onClick={() => {
                setExpanded((prev) => !prev);
              }}
            />
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4">
            {transaction.type !== 'TRANSFER' && (
              <>
                {transaction.participants.map(({ id, name, balance }) => (
                  <ParticipantListItem key={id} avatar={<Avatar name={name} />}>
                    <div>
                      <span className="font-semibold">{name}</span>
                      {balance.actual.amount !== 0 && (
                        <>
                          {transaction.type === 'EXPENSE'
                            ? ' paid '
                            : ' received '}
                          <Badge>
                            {formatCurrency(balance.actual, {
                              signDisplay: 'never',
                            })}
                          </Badge>
                        </>
                      )}
                      <br />
                      <Badge variant="secondary">
                        {formatCurrency(balance.share, {
                          signDisplay: 'never',
                        })}
                      </Badge>
                    </div>
                  </ParticipantListItem>
                ))}
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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </MotionCard>
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
        <Alert>
          <AlertTitle>No transactions</AlertTitle>
        </Alert>
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
              className="flex items-center gap-4 px-2 "
              {...scaleOut}
            >
              {formatDateRelative(Temporal.Instant.fromEpochMilliseconds(date))}
              <Separator className="relative top-[1.5px] w-auto grow" />
              {sum ? formatCurrency(sum) : '–'}
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
          ];
        })}
      </AnimatePresence>
    </div>
  );
};
