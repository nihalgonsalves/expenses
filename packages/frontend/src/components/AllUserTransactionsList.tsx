import { motion, AnimatePresence } from 'framer-motion';
import { Fragment, useMemo, useState } from 'react';

import { sumMoney, type Money } from '@nihalgonsalves/expenses-shared/money';
import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import type { AllConvertedUserTransactions } from '../api/useAllUserTransactions';
import { usePreferredCurrencyCode } from '../state/preferences';
import { formatCurrency } from '../utils/money';
import {
  clsxtw,
  formatDateTimeRelative,
  getTransactionDescription,
  groupBySpentAt,
  shortDateFormatter,
} from '../utils/utils';

import { CategoryAvatar } from './CategoryAvatar';

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
    <motion.tr key={transaction.id} layout>
      <td>
        <div className="flex items-center gap-4">
          <CategoryAvatar category={transaction.category} />
        </div>
      </td>

      <td className="hidden sm:table-cell">
        <strong>{description}</strong>
      </td>
      <td className="hidden sm:table-cell">{dateTime}</td>

      <td className="sm:hidden">
        <strong>{description}</strong>
        <br />
        <em>{dateTime}</em>
        <br />
        {sheet.name}
      </td>

      <td className="text-right">
        {convertedMoney == undefined || convertedMoney === money ? (
          <span>{money}</span>
        ) : (
          <>
            {convertedMoney}
            <br />
            <span className="text-gray-300">{money}</span>
          </>
        )}
      </td>
      <td className="hidden sm:table-cell">{sheet.name}</td>
    </motion.tr>
  );
};

const variants = {
  enter: (direction: 'left' | 'right') => ({
    x: direction === 'left' ? '-100dvw' : '100dvw',
  }),
  center: {
    x: 0,
  },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'left' ? '100dvw' : '-100dvw',
  }),
};

const ButtonStat = ({
  title,
  desc,
  value,
  selected,
  setSelected,
}: {
  title: string;
  desc: string;
  value: string;
  selected: boolean;
  setSelected: () => void;
}) => (
  <button
    aria-selected={selected}
    className={clsxtw(
      'stat place-items-center',
      selected ? 'btn-secondary text-secondary-content' : 'btn-ghost',
    )}
    onClick={setSelected}
  >
    <span
      className={clsxtw('stat-title', selected && 'text-secondary-content')}
    >
      {title}
    </span>
    <span className="stat-value text-xl md:text-4xl">{value}</span>
    <span className={clsxtw('stat-desc', selected && 'text-secondary-content')}>
      {desc}
    </span>
  </button>
);

export const AllUserTransactionsList = ({
  data,
}: {
  data: AllConvertedUserTransactions;
}) => {
  const [preferredCurrencyCode] = usePreferredCurrencyCode();

  const [selectedView, setSelectedView] = useState<'EXPENSES' | 'INCOME'>(
    'EXPENSES',
  );
  const nextMotionTowardsDirection =
    selectedView === 'EXPENSES' ? ('left' as const) : ('right' as const);

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
      <div className="p-3 md:p-5">
        <div className="stats w-full shadow">
          <ButtonStat
            title="Spent"
            desc="this month"
            value={formatCurrency(totalSpent)}
            selected={selectedView === 'EXPENSES'}
            setSelected={() => {
              setSelectedView('EXPENSES');
            }}
          />
          <ButtonStat
            title="Income"
            desc="this month"
            value={formatCurrency(totalEarned)}
            selected={selectedView === 'INCOME'}
            setSelected={() => {
              setSelectedView('INCOME');
            }}
          />
        </div>
      </div>

      <AnimatePresence
        initial={false}
        mode="popLayout"
        custom={nextMotionTowardsDirection}
      >
        <motion.table
          key={selectedView}
          className="table table-pin-rows table-auto"
          variants={variants}
          custom={nextMotionTowardsDirection}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30, duration: 0.2 },
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {[...groupedByDate.keys()].map((date) => (
              <Fragment key={date}>
                <thead>
                  <tr>
                    <th>Category</th>

                    <th className="hidden sm:table-cell">Description</th>
                    <th className="hidden sm:table-cell">
                      Date ({shortDateFormatter.format(date)})
                    </th>

                    <th className="sm:hidden">
                      Details ({shortDateFormatter.format(date)})
                    </th>

                    <th className="text-right">Amount</th>
                    <th className="hidden sm:table-cell">Sheet</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByDate
                    .get(date)
                    ?.map(({ transaction, sheet }) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        sheet={sheet}
                      />
                    ))}
                </tbody>
              </Fragment>
            ))}
          </AnimatePresence>
        </motion.table>
      </AnimatePresence>
    </>
  );
};
