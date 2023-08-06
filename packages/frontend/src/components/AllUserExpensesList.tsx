import { motion, AnimatePresence } from 'framer-motion';
import { Fragment, useMemo, useState } from 'react';

import type {
  Sheet,
  ExpenseListItem,
  GetAllUserExpensesResponse,
  Money,
} from '@nihalgonsalves/expenses-backend';
import { sumMoney } from '@nihalgonsalves/expenses-backend/src/utils/money';

import { useConvertCurrency } from '../api/currencyConversion';
import { usePreferredCurrencyCode } from '../state/preferences';
import { formatCurrency } from '../utils/money';
import {
  clsxtw,
  formatDateTimeRelative,
  getExpenseDescription,
  groupBySpentAt,
  shortDateFormatter,
} from '../utils/utils';

import { CategoryAvatar } from './CategoryAvatar';

const ExpenseRow = ({
  expense,
  sheet,
}: {
  expense: ExpenseListItem & { convertedMoney: Money | undefined };
  sheet: Sheet;
}) => {
  const money = formatCurrency(expense.money, {
    signDisplay: expense.type === 'TRANSFER' ? 'never' : 'always',
  });
  const convertedMoney = expense.convertedMoney
    ? formatCurrency(expense.convertedMoney, {
        signDisplay: expense.type === 'TRANSFER' ? 'never' : 'always',
      })
    : undefined;

  const description = getExpenseDescription(expense);
  const dateTime = formatDateTimeRelative(expense.spentAt);

  return (
    <motion.tr key={expense.id} layout>
      <td>
        <div className="flex items-center gap-4">
          <CategoryAvatar category={expense.category} />
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

export const AllUserExpensesList = ({
  data,
}: {
  data: GetAllUserExpensesResponse;
}) => {
  const [selectedView, setSelectedView] = useState<'EXPENSES' | 'INCOME'>(
    'EXPENSES',
  );
  const nextMotionTowardsDirection =
    selectedView === 'EXPENSES' ? ('left' as const) : ('right' as const);

  const [preferredCurrencyCode] = usePreferredCurrencyCode();

  const convertCurrency = useConvertCurrency(
    [
      ...new Set([
        ...data.expenses.map(({ expense }) => expense.money.currencyCode),
        ...data.earnings.map(({ expense }) => expense.money.currencyCode),
      ]),
    ],
    preferredCurrencyCode,
  );

  const convertedExpenses = useMemo(
    () =>
      data.expenses.map(({ sheet, expense }) => ({
        sheet,
        expense: {
          ...expense,
          convertedMoney: convertCurrency(expense.money),
        },
      })),
    [data.expenses, convertCurrency],
  );

  const convertedEarnings = useMemo(
    () =>
      data.earnings.map(({ sheet, expense }) => ({
        sheet,
        expense: {
          ...expense,
          convertedMoney: convertCurrency(expense.money),
        },
      })),
    [data.earnings, convertCurrency],
  );

  const totalSpent = sumMoney(
    convertedExpenses
      .map(({ expense }) => expense.convertedMoney)
      .filter((x): x is NonNullable<typeof x> => x != null),
    preferredCurrencyCode,
  );
  const totalEarned = sumMoney(
    convertedEarnings
      .map(({ expense }) => expense.convertedMoney)
      .filter((x): x is NonNullable<typeof x> => x != null),
    preferredCurrencyCode,
  );

  const groupedByDate = useMemo(
    () =>
      groupBySpentAt(
        selectedView === 'EXPENSES' ? convertedExpenses : convertedEarnings,
        ({ expense }) => expense.spentAt,
      ),
    [selectedView, convertedExpenses, convertedEarnings],
  );

  return (
    <>
      <div className="p-4">
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
                    ?.map(({ expense, sheet }) => (
                      <ExpenseRow
                        key={expense.id}
                        expense={expense}
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
