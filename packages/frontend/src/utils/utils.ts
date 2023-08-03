import { Temporal } from '@js-temporal/polyfill';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type {
  GroupSheetExpenseListItem,
  ExpenseListItem,
} from '@nihalgonsalves/expenses-backend';

import { categoryById } from '../data/categories';

import { formatCurrency } from './money';

export const clsxtw = (...classes: ClassValue[]) => twMerge(clsx(...classes));

export const getUserLanguage = () => globalThis.navigator.languages[0];

export const generateId = () => {
  const bytes = new Uint8Array(36);
  globalThis.crypto.getRandomValues(bytes);

  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join('');

  return btoa(binString).replace(/\+/g, '-').replace(/\//g, '_');
};

// simply check for anything@anything.anytld
export const prevalidateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const CURRENT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const dateTimeLocalToISOString = (val: string) =>
  Temporal.PlainDateTime.from(val).toZonedDateTime(CURRENT_TIMEZONE).toString();

export const dateToISOString = (date: Date) =>
  Temporal.Instant.fromEpochMilliseconds(date.valueOf())
    .toZonedDateTimeISO(CURRENT_TIMEZONE)
    .toString();

export const nowForDateTimeInput = () =>
  Temporal.Now.plainDateTimeISO().round('minutes').toString();

export const shortDateTime = new Intl.DateTimeFormat(getUserLanguage(), {
  dateStyle: 'short',
  timeStyle: 'short',
});

const shortRelativeFormat = new Intl.RelativeTimeFormat(getUserLanguage(), {
  style: 'short',
});

export const formatDateTimeRelative = (iso8601: string) => {
  const instant = Temporal.Instant.from(iso8601);

  const relativeToNow = instant.since(Temporal.Now.instant());

  const durationRounded = relativeToNow.round({
    smallestUnit: 'second',
    largestUnit: 'day',
  });

  const { days, hours, minutes } = durationRounded.abs();

  if (days >= 7) {
    return shortDateTime.format(instant.epochMilliseconds);
  }

  if (days >= 1) {
    return shortRelativeFormat.format(durationRounded.days, 'day');
  }

  if (hours >= 1) {
    return shortRelativeFormat.format(durationRounded.hours, 'hours');
  }

  if (minutes >= 1) {
    return shortRelativeFormat.format(durationRounded.minutes, 'minutes');
  }

  return 'just now';
};

export const getInitials = (name: string): string => {
  const [first, last] = name.split(' ');

  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
};

export const getShortName = (name: string): string => name.split(' ')[0] ?? '';

export const joinList = (list: string[]): string => {
  if (list.length === 0) {
    return '';
  }

  if (list.length === 1) {
    return list[0] ?? '';
  }

  if (list.length === 2) {
    return `${list[0]} & ${list[1]}`;
  }

  return `${list.slice(0, -1).join(', ')} & ${list.at(-1)}`;
};

export const getExpenseDescription = (
  expense: Pick<ExpenseListItem, 'category' | 'description'>,
): string =>
  (expense.description || undefined) ??
  categoryById[expense.category]?.name ??
  expense.category;

export const getGroupSheetExpenseSummaryText = (
  expense: GroupSheetExpenseListItem,
): string => {
  if (expense.type === 'TRANSFER') {
    // TODO improve API for transfer type
    // This works because of the sorting of + first
    const [to, from] = expense.participants;

    return `${getShortName(to?.name ?? '')} paid ${getShortName(
      from?.name ?? '',
    )}`;
  }

  if (expense.yourBalance.amount === 0) {
    return 'Not involved';
  }

  const balanceFormatted = formatCurrency(expense.yourBalance, {
    signDisplay: 'never',
  });

  const oweOrReceive =
    expense.yourBalance.amount < 0 ? 'You receive' : 'You owe';

  return `${oweOrReceive} ${balanceFormatted}`;
};
