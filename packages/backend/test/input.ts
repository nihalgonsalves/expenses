import { Temporal } from '@js-temporal/polyfill';

import type {
  CreatePersonalSheetExpenseInput,
  CreateGroupSheetExpenseInput,
} from '../src/service/expense/types';

export const createPersonalSheetExpenseInput = (
  personalSheetId: string,
  currencyCode: string,
  amount = -100_00,
): CreatePersonalSheetExpenseInput => ({
  personalSheetId,
  description: 'Test expense',
  category: 'other',
  money: { amount, scale: 2, currencyCode },
  spentAt: Temporal.Now.zonedDateTimeISO().toString(),
});

export const createGroupSheetExpenseInput = (
  groupSheetId: string,
  currencyCode: string,
  paidById: string,
  otherId: string,
  amount = -100_00,
  split1 = -25_00,
  split2 = -75_00,
): CreateGroupSheetExpenseInput => ({
  groupSheetId,
  description: 'Test expense',
  category: 'other',
  money: { amount, scale: 2, currencyCode },
  paidById,
  spentAt: Temporal.Now.zonedDateTimeISO().toString(),
  splits: [
    {
      participantId: paidById,
      share: { amount: split1, scale: 2, currencyCode },
    },
    {
      participantId: otherId,
      share: { amount: split2, scale: 2, currencyCode },
    },
  ],
});
