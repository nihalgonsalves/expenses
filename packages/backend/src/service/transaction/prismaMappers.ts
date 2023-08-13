import { Temporal } from '@js-temporal/polyfill';
import type { Prisma } from '@prisma/client';

import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type {
  CreatePersonalSheetTransactionInput,
  CreatePersonalSheetTransactionScheduleInput,
} from '@nihalgonsalves/expenses-shared/types/transaction';
import type { User } from '@nihalgonsalves/expenses-shared/types/user';

import { generateId } from '../../utils/nanoid';

import { getFloatingRRuleDate } from './rruleUtils';

export const mapInputToCreatePersonalTransaction = (
  input: Omit<
    CreatePersonalSheetTransactionInput,
    'personalSheetId' | 'spentAt'
  > & {
    spentAt: string | Temporal.ZonedDateTime;
  },
  personalSheet: Sheet,
  id = generateId(),
): Prisma.TransactionUncheckedCreateInput => ({
  id,
  sheetId: personalSheet.id,
  amount: input.type === 'EXPENSE' ? -input.money.amount : input.money.amount,
  scale: input.money.scale,
  type: input.type,
  category: input.category,
  description: input.description,
  spentAt: Temporal.ZonedDateTime.from(input.spentAt).toInstant().toString(),
});

export const mapInputToCreatePersonalTransactionSchedule = (
  input: Omit<CreatePersonalSheetTransactionScheduleInput, 'personalSheetId'>,
  personalSheet: Sheet,
): Prisma.TransactionScheduleUncheckedCreateInput => ({
  id: generateId(),
  sheetId: personalSheet.id,
  amount: input.type === 'EXPENSE' ? -input.money.amount : input.money.amount,
  scale: input.money.scale,
  type: input.type,
  category: input.category,
  description: input.description,
  tzId: input.tzId,
  rruleFreq: input.recurrenceRule.freq,
  // Note: this is a TIMESTAMP WITHOUT TIMEZONE in Postgres, since the rrule library uses a 'floating' date
  rruleDtstart: getFloatingRRuleDate(input.recurrenceRule.dtstart),
  nextOccurrenceAt: Temporal.PlainDateTime.from(input.recurrenceRule.dtstart)
    .toZonedDateTime(input.tzId)
    .toInstant()
    .toString(),
});

export const mapInputToCreatePersonalTransactionEntry = (
  input: Omit<CreatePersonalSheetTransactionInput, 'personalSheetId'>,
  user: User,
): Omit<Prisma.TransactionEntryUncheckedCreateInput, 'transactionId'> => ({
  id: generateId(),
  userId: user.id,
  amount: input.type === 'EXPENSE' ? -input.money.amount : input.money.amount,
  scale: input.money.scale,
});
