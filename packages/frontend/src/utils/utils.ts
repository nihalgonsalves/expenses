import type {
  GroupSheetTransactionListItem,
  TransactionListItem,
} from '@nihalgonsalves/expenses-shared/types/transaction';

import { formatCurrency } from './money';
import { isoToTemporalZonedDateTime } from './temporal';

export const getUserLanguage = () => globalThis.navigator.languages[0];

// simply check for anything@anything.anytld
export const prevalidateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getInitials = (name: string): string => {
  const [first, last] = name.split(' ');

  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
};

export const getShortName = (name: string): string => name.split(' ')[0] ?? '';

export const getTransactionDescription = ({
  description,
  category,
}: Pick<TransactionListItem, 'category' | 'description'>): string =>
  (description || undefined) ?? category;

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
    const date = isoToTemporalZonedDateTime(getSpentAt(item)).round({
      smallestUnit: 'day',
      roundingMode: 'trunc',
    }).epochMilliseconds;

    const existing = groupedByDate.get(date);

    if (existing) {
      existing.push(item);
    } else {
      groupedByDate.set(date, [item]);
    }
  }

  return groupedByDate;
};

export const noop = () => {
  // do nothing
};
