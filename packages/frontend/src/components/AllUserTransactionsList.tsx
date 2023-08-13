import type { Temporal } from '@js-temporal/polyfill';
import { motion, AnimatePresence } from 'framer-motion';
import { Fragment, useMemo, useState } from 'react';
import { MdArrowLeft, MdArrowRight } from 'react-icons/md';

import { sumMoney, type Money } from '@nihalgonsalves/expenses-shared/money';
import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import type { AllConvertedUserTransactions } from '../api/useAllUserTransactions';
import { usePreferredCurrencyCode } from '../state/preferences';
import { fadeInOut } from '../utils/framer';
import { formatCurrency } from '../utils/money';
import {
  clsxtw,
  formatDateTimeRelative,
  getTransactionDescription,
  groupBySpentAt,
  shortDateFormatter,
} from '../utils/utils';

import { CategoryAvatar } from './CategoryAvatar';
import { Button } from './form/Button';

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
    <motion.tr key={transaction.id} {...fadeInOut}>
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
  offsetByDuration,
  displayPeriod,
}: {
  data: AllConvertedUserTransactions;
  offsetByDuration: (duration: Temporal.DurationLike) => void;
  displayPeriod: string;
}) => {
  const [preferredCurrencyCode] = usePreferredCurrencyCode();

  const [selectedView, setSelectedView] = useState<'EXPENSES' | 'INCOME'>(
    'EXPENSES',
  );

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
        <div className="join">
          <Button
            className="join-item"
            onClick={() => {
              offsetByDuration({ months: -1 });
            }}
          >
            <MdArrowLeft />
          </Button>
          <Button className="join-item flex-grow">{displayPeriod}</Button>
          <Button
            className="join-item"
            onClick={() => {
              offsetByDuration({ months: 1 });
            }}
          >
            <MdArrowRight />
          </Button>
        </div>
        <div className="stats w-full shadow">
          <ButtonStat
            title="Expenses"
            desc=""
            value={formatCurrency(totalSpent)}
            selected={selectedView === 'EXPENSES'}
            setSelected={() => {
              setSelectedView('EXPENSES');
            }}
          />
          <ButtonStat
            title="Income"
            desc=""
            value={formatCurrency(totalEarned)}
            selected={selectedView === 'INCOME'}
            setSelected={() => {
              setSelectedView('INCOME');
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.table
          key={selectedView}
          className="table table-pin-rows table-auto"
          {...fadeInOut}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {[...groupedByDate.keys()].map((date) => (
              <Fragment key={date}>
                <motion.thead {...fadeInOut}>
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
                </motion.thead>
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
