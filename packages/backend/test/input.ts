import { Temporal } from '@js-temporal/polyfill';

import type {
  CreatePersonalSheetExpenseInput,
  CreateGroupSheetExpenseInput,
} from '../src/service/expense/types';

export const createPersonalSheetExpenseInput = (
  personalSheetId: string,
  currencyCode: string,
): CreatePersonalSheetExpenseInput => ({
  personalSheetId,
  description: 'Test expense',
  category: 'other',
  money: { amount: 100_00, scale: 2, currencyCode },
  spentAt: Temporal.Now.zonedDateTimeISO().toString(),
});

export const createGroupSheetExpenseInput = (
  groupSheetId: string,
  currencyCode: string,
  paidById: string,
  otherId: string,
): CreateGroupSheetExpenseInput => ({
  groupSheetId,
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
