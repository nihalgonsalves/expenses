import type { Temporal } from '@js-temporal/polyfill';
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Fragment, useMemo, useState } from 'react';
import { z } from 'zod';

import { sumMoney, type Money } from '@nihalgonsalves/expenses-shared/money';
import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import type { AllConvertedUserTransactions } from '../api/useAllUserTransactions';
import { usePreferredCurrencyCode } from '../state/preferences';
import { fadeInOut } from '../utils/framer';
import { formatCurrency } from '../utils/money';
import {
  formatDateTimeRelative,
  getTransactionDescription,
  groupBySpentAt,
  shortDateFormatter,
} from '../utils/utils';

import { CategoryAvatar } from './CategoryAvatar';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

const MotionTableRow = motion(TableRow);

const TransactionRow = ({
  transaction,
  sheet,
}: {
  transaction: TransactionListItem & { convertedMoney: Money | undefined };
  sheet: Sheet;
}) => {
  const money = formatCurrency(transaction.money, {
    signDisplay: transaction.type === 'TRANSFER' ? 'never' : 'always',
  });
  const convertedMoney = transaction.convertedMoney
    ? formatCurrency(transaction.convertedMoney, {
        signDisplay: transaction.type === 'TRANSFER' ? 'never' : 'always',
      })
    : undefined;

  const description = getTransactionDescription(transaction);
  const dateTime = formatDateTimeRelative(transaction.spentAt);

  return (
    <MotionTableRow key={transaction.id} {...fadeInOut}>
      <TableCell>
        <div className="flex items-center gap-4">
          <CategoryAvatar category={transaction.category} />
        </div>
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        <strong>{description}</strong>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{dateTime}</TableCell>

      <TableCell className="sm:hidden">
        <strong>{description}</strong>
        <br />
        <em>{dateTime}</em>
        <br />
        {sheet.name}
      </TableCell>

      <TableCell className="text-right">
        {convertedMoney == undefined || convertedMoney === money ? (
          <span>{money}</span>
        ) : (
          <>
            {convertedMoney}
            <br />
            <span className="text-gray-300">{money}</span>
          </>
        )}
      </TableCell>
      <TableCell className="hidden sm:table-cell">{sheet.name}</TableCell>
    </MotionTableRow>
  );
};

const ButtonStat = ({
  title,
  value,
  amount,
}: {
  title: string;
  value: string;
  amount: string;
}) => (
  <ToggleGroupItem
    className="flex h-full grow flex-col place-items-center p-4"
    value={value}
  >
    <span>{title}</span>
    <span className="md:text-4xl">{amount}</span>
  </ToggleGroupItem>
);

const MotionTable = motion(Table);
const MotionTableHeader = motion(TableHeader);

const ZView = z.enum(['EXPENSES', 'INCOME']);

export const AllUserTransactionsList = ({
  data,
  offsetByDuration,
  displayPeriod,
}: {
  data: AllConvertedUserTransactions;
  offsetByDuration: (duration: Temporal.DurationLike) => void;
  displayPeriod: string;
}) => {
  const [preferredCurrencyCode] = usePreferredCurrencyCode();

  const [selectedView, setSelectedView] =
    useState<z.infer<typeof ZView>>('EXPENSES');

  const totalSpent = sumMoney(
    data.expenses
      .map(({ transaction }) => transaction.convertedMoney)
      .filter((x): x is NonNullable<typeof x> => x != null),
    preferredCurrencyCode,
  );

  const totalEarned = sumMoney(
    data.earnings
      .map(({ transaction }) => transaction.convertedMoney)
      .filter((x): x is NonNullable<typeof x> => x != null),
    preferredCurrencyCode,
  );

  const groupedByDate = useMemo(
    () =>
      groupBySpentAt(
        selectedView === 'EXPENSES' ? data.expenses : data.earnings,
        ({ transaction }) => transaction.spentAt,
      ),
    [selectedView, data.expenses, data.earnings],
  );

  return (
    <>
      <div className="flex flex-col gap-4 p-2 md:mb-2">
        <div className="flex items-center gap-2 rounded-md bg-muted p-1">
          <Button
            variant="ghost"
            onClick={() => {
              offsetByDuration({ months: -1 });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <div className="grow text-center">{displayPeriod}</div>
          <Button
            variant="ghost"
            onClick={() => {
              offsetByDuration({ months: 1 });
            }}
          >
            <ArrowRightIcon />
          </Button>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          value={selectedView}
          onValueChange={(value) => {
            setSelectedView(ZView.parse(value));
          }}
        >
          <ButtonStat
            title="Expenses"
            value={'EXPENSES'}
            amount={formatCurrency(totalSpent)}
          />
          <ButtonStat
            title="Income"
            value={'INCOME'}
            amount={formatCurrency(totalEarned)}
          />
        </ToggleGroup>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <MotionTable key={selectedView} className="p-4" {...fadeInOut}>
          <AnimatePresence mode="popLayout" initial={false}>
            {[...groupedByDate.keys()].map((date) => (
              <Fragment key={date}>
                <MotionTableHeader {...fadeInOut}>
                  <TableRow>
                    <TableHead>Category</TableHead>

                    <TableHead className="hidden sm:table-cell">
                      Description
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Date ({shortDateFormatter.format(date)})
                    </TableHead>

                    <TableHead className="sm:hidden">
                      Details ({shortDateFormatter.format(date)})
                    </TableHead>

                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Sheet
                    </TableHead>
                  </TableRow>
                </MotionTableHeader>
                <TableBody>
                  {groupedByDate
                    .get(date)
                    ?.map(({ transaction, sheet }) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        sheet={sheet}
                      />
                    ))}
                </TableBody>
              </Fragment>
            ))}
          </AnimatePresence>
        </MotionTable>
      </AnimatePresence>
    </>
  );
};
