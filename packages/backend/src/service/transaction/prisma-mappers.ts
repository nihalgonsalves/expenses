import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";
import type {
  CreatePersonalSheetTransactionInput,
  CreatePersonalSheetTransactionScheduleInput,
} from "@nihalgonsalves/expenses-shared/types/transaction";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import type { Prisma } from "../../prisma/client.ts";
import { generateId } from "../../utils/nanoid.ts";

const mapOriginalMoney = (
  input: Pick<CreatePersonalSheetTransactionInput, "originalMoney" | "type">,
) => {
  if (!input.originalMoney) return {};

  return {
    originalAmount:
      input.type === "EXPENSE"
        ? -input.originalMoney.amount
        : input.originalMoney.amount,
    originalScale: input.originalMoney.scale,
    originalCurrencyCode: input.originalMoney.currencyCode,
  };
};

export const mapInputToCreatePersonalTransaction = (
  input: Omit<
    CreatePersonalSheetTransactionInput,
    "personalSheetId" | "spentAt"
  > & {
    spentAt: string | Temporal.ZonedDateTime;
  },
  personalSheet: Sheet,
  id = generateId(),
): Prisma.TransactionUncheckedCreateInput => ({
  id,
  sheetId: personalSheet.id,
  amount: input.type === "EXPENSE" ? -input.money.amount : input.money.amount,
  scale: input.money.scale,
  type: input.type,
  category: input.category,
  description: input.description,
  spentAt: Temporal.ZonedDateTime.from(input.spentAt).toInstant().toString(),
  ...mapOriginalMoney(input),
});

export const mapInputToCreatePersonalTransactionSchedule = (
  input: Omit<CreatePersonalSheetTransactionScheduleInput, "personalSheetId">,
  personalSheet: Sheet,
): Prisma.TransactionScheduleUncheckedCreateInput => {
  const firstOccurrenceAt = Temporal.ZonedDateTime.from(
    input.firstOccurrenceAt,
  );

  return {
    id: generateId(),
    sheetId: personalSheet.id,
    amount: input.type === "EXPENSE" ? -input.money.amount : input.money.amount,
    scale: input.money.scale,
    type: input.type,
    category: input.category,
    description: input.description,
    rruleFreq: input.recurrenceRule.freq,
    nextOccurrenceTzId: firstOccurrenceAt.timeZoneId,
    nextOccurrenceAt: firstOccurrenceAt.toInstant().toString(),
  };
};

export const mapInputToCreatePersonalTransactionEntry = (
  input: Omit<CreatePersonalSheetTransactionInput, "personalSheetId">,
  user: User,
): Omit<Prisma.TransactionEntryUncheckedCreateInput, "transactionId"> => ({
  id: generateId(),
  userId: user.id,
  amount: input.type === "EXPENSE" ? -input.money.amount : input.money.amount,
  scale: input.money.scale,
});
