import { Temporal } from '@js-temporal/polyfill';

import { type CreateExpenseInput } from '../src/service/expense/types';

export const createExpenseInput = (
  groupId: string,
  currencyCode: string,
  paidById: string,
  otherId: string,
): CreateExpenseInput => ({
  groupId,
  description: 'Test expense',
  category: 'other',
  money: { amount: 100_00, scale: 2, currencyCode },
  paidById,
  spentAt: Temporal.Now.zonedDateTimeISO().toString(),
  splits: [
    {
      participantId: paidById,
      share: { amount: 25_00, scale: 2, currencyCode },
    },
    {
      participantId: otherId,
      share: { amount: 75_00, scale: 2, currencyCode },
    },
  ],
});
