import { Temporal } from '@js-temporal/polyfill';
import { Pencil1Icon } from '@radix-ui/react-icons';
import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { sumMoneyOrUndefined } from '@nihalgonsalves/expenses-shared/money';
import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../../api/trpc';
import { scaleOut } from '../../utils/framer';
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
import { Alert, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { Separator } from '../ui/separator';

const MotionCard = motion(Card);

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
    <MotionCard ref={ref} key={transaction.id} {...scaleOut}>
      <Collapsible open={expanded}>
        <CardHeader>
          <div className="flex w-full gap-4">
            <CategoryAvatar category={transaction.category} />
            <div>
              {title}
              <br />
              {formatDateTimeRelative(transaction.spentAt)}
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
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4">
            <Button variant="outline" asChild>
              <Link
                to={`/sheets/${personalSheetId}/transactions/${transaction.id}`}
              >
                <Pencil1Icon className="mr-2" /> Edit
              </Link>
            </Button>

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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </MotionCard>
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
              className="flex items-center gap-4 px-2"
              {...scaleOut}
            >
              {formatDateRelative(Temporal.Instant.fromEpochMilliseconds(date))}
              <Separator className="relative top-[1.5px] w-auto grow" />
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
