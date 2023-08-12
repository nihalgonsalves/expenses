import { Temporal } from '@js-temporal/polyfill';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type {
  GroupSheetTransactionListItem,
  TransactionListItem,
} from '@nihalgonsalves/expenses-shared/types/transaction';

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

export const durationMilliseconds = (duration: Temporal.DurationLike) =>
  Temporal.Duration.from(duration).total('milliseconds');

export const dateTimeLocalToISOString = (val: string) =>
  Temporal.PlainDateTime.from(val).toZonedDateTime(CURRENT_TIMEZONE).toString();

export const dateToISOString = (date: Date) =>
  Temporal.Instant.fromEpochMilliseconds(date.valueOf())
    .toZonedDateTimeISO(CURRENT_TIMEZONE)
    .toString();

export const isoToTemporalZonedDateTime = (iso: string) =>
  Temporal.Instant.from(iso).toZonedDateTimeISO(CURRENT_TIMEZONE);

export const nowForDateTimeInput = () =>
  Temporal.Now.plainDateTimeISO().round('minutes').toString();

export const shortDateFormatter = new Intl.DateTimeFormat(getUserLanguage(), {
  dateStyle: 'short',
});

export const shortDateTimeFormatter = new Intl.DateTimeFormat(
  getUserLanguage(),
  {
    dateStyle: 'short',
    timeStyle: 'short',
  },
);

const shortRelativeFormatter = new Intl.RelativeTimeFormat(getUserLanguage(), {
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
    return shortDateTimeFormatter.format(instant.epochMilliseconds);
  }

  if (days >= 1) {
    return shortRelativeFormatter.format(durationRounded.days, 'day');
  }

  if (hours >= 1) {
    return shortRelativeFormatter.format(durationRounded.hours, 'hours');
  }

  if (minutes >= 1) {
    return shortRelativeFormatter.format(durationRounded.minutes, 'minutes');
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

export const getTransactionDescription = ({
  description,
  category,
}: Pick<TransactionListItem, 'category' | 'description'>): string =>
  (description || undefined) ?? categoryById[category]?.name ?? category;

export const getGroupSheetTransactionSummaryText = ({
  type,
  participants,
  yourBalance,
}: GroupSheetTransactionListItem): string => {
  if (type === 'TRANSFER') {
    const to = participants.find((p) => p.type === 'transfer_to');
    const from = participants.find((p) => p.type === 'transfer_from');

    return `${getShortName(to?.name ?? '')} paid ${getShortName(
      from?.name ?? '',
    )}`;
  }

  if (yourBalance == null) {
    return 'Not involved';
  }

  return `Your share: ${formatCurrency(yourBalance.share, {
    signDisplay: 'never',
  })}`;
};

export const groupBySpentAt = <T>(
  items: T[],
  getSpentAt: (item: T) => string,
) => {
  const groupedByDate = new Map<number, T[]>();

  // TODO: proposal-array-grouping (TypeScript 5.3?)
  for (const item of items) {
    const date = isoToTemporalZonedDateTime(getSpentAt(item)).round(
      'day',
    ).epochMilliseconds;

    const existing = groupedByDate.get(date);

    if (existing) {
      existing.push(item);
    } else {
      groupedByDate.set(date, [item]);
    }
  }

  return groupedByDate;
};
