import { faker } from '@faker-js/faker';
import { Temporal } from '@js-temporal/polyfill';

import type {
  CreatePersonalSheetTransactionInput,
  CreateGroupSheetTransactionInput,
  CreatePersonalSheetTransactionScheduleInput,
} from '@nihalgonsalves/expenses-shared/types/transaction';

export const createPersonalSheetTransactionInput = (
  personalSheetId: string,
  currencyCode: string,
  type: 'EXPENSE' | 'INCOME',
  amount = 100_00,
): CreatePersonalSheetTransactionInput => ({
  personalSheetId,
  type,
  description: `test personal ${type.toLowerCase()}`,
  category: 'other',
  money: { amount, scale: 2, currencyCode },
  spentAt: Temporal.Now.zonedDateTimeISO().toString(),
});

export const createPersonalSheetTransactionScheduleInput = (
  personalSheetId: string,
  currencyCode: string,
  type: 'EXPENSE' | 'INCOME',
  amount = 100_00,
  dtstart = Temporal.Now.plainDateTimeISO().toString(),
): CreatePersonalSheetTransactionScheduleInput => ({
  personalSheetId,
  type,
  description: `test personal ${type.toLowerCase()}`,
  category: 'other',
  money: { amount, scale: 2, currencyCode },
  tzId: faker.location.timeZone(),
  recurrenceRule: {
    freq: 'MONTHLY',
    dtstart,
  },
});

export const createGroupSheetTransactionInput = (
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
  description: `test group ${type.toLowerCase()}`,
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
