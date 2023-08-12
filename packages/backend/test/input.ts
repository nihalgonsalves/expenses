import { Temporal } from '@js-temporal/polyfill';

import type {
  CreatePersonalSheetTransactionInput,
  CreateGroupSheetTransactionInput,
} from '@nihalgonsalves/expenses-shared/types/transaction';

export const createPersonalSheetExpenseInput = (
  personalSheetId: string,
  currencyCode: string,
  type: 'EXPENSE' | 'INCOME',
  amount = 100_00,
): CreatePersonalSheetTransactionInput => ({
  personalSheetId,
  type,
  description: 'Test expense',
  category: 'other',
  money: { amount, scale: 2, currencyCode },
  spentAt: Temporal.Now.zonedDateTimeISO().toString(),
});

export const createGroupSheetExpenseInput = (
  type: 'EXPENSE' | 'INCOME',
  groupSheetId: string,
  currencyCode: string,
  paidOrReceivedById: string,
  otherId: string,
  amount = 100_00,
  split1 = 25_00,
  split2 = 75_00,
): CreateGroupSheetTransactionInput => ({
  type,
  groupSheetId,
  description: 'Test expense',
  category: 'other',
  money: { amount, scale: 2, currencyCode },
  paidOrReceivedById,
  spentAt: Temporal.Now.zonedDateTimeISO().toString(),
  splits: [
    {
      participantId: paidOrReceivedById,
      share: { amount: split1, scale: 2, currencyCode },
    },
    {
      participantId: otherId,
      share: { amount: split2, scale: 2, currencyCode },
    },
  ],
});
