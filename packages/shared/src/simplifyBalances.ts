import {
  type Dinero,
  greaterThan,
  isZero,
  isPositive,
  isNegative,
  multiply,
  add,
  subtract,
} from "dinero.js";
import FastPriorityQueue from "fastpriorityqueue";

import { type Money, sumMoney, moneyToDinero, dineroToMoney } from "./money.ts";

export type Balance = {
  id: string;
  dinero: Dinero<number>;
};

export type Transfer = {
  from: string;
  to: string;
  money: Money;
};

/* oxlint-disable typescript/no-non-null-assertion */

export const simplifyBalances = (
  currencyCode: string,
  balanceRecord: Record<string, Money>,
): Transfer[] => {
  if (sumMoney(Object.values(balanceRecord), currencyCode).amount !== 0) {
    throw new Error("The sum of balances must be zero");
  }

  const balances: Balance[] = Object.entries(balanceRecord).map(
    ([id, money]) => ({
      id,
      dinero: moneyToDinero(money),
    }),
  );

  const creditPQ = new FastPriorityQueue<Balance>((a, b) =>
    greaterThan(a.dinero, b.dinero),
  );
  const debitPQ = new FastPriorityQueue<Balance>((a, b) =>
    greaterThan(a.dinero, b.dinero),
  );

  for (const balance of balances) {
    if (isPositive(balance.dinero)) {
      creditPQ.add(balance);
    } else if (isNegative(balance.dinero)) {
      debitPQ.add({ id: balance.id, dinero: multiply(balance.dinero, -1) });
    }
  }

  const transfers: Transfer[] = [];

  while (creditPQ.size > 0 && debitPQ.size > 0) {
    const credit = creditPQ.poll()!;
    const debit = debitPQ.poll()!;

    if (greaterThan(credit.dinero, debit.dinero)) {
      const amountLeft = subtract(credit.dinero, debit.dinero);
      transfers.push({
        from: debit.id,
        to: credit.id,
        money: dineroToMoney(debit.dinero),
      });
      creditPQ.add({ id: credit.id, dinero: amountLeft });
    } else if (greaterThan(debit.dinero, credit.dinero)) {
      const amountLeft = subtract(debit.dinero, credit.dinero);
      transfers.push({
        from: debit.id,
        to: credit.id,
        money: dineroToMoney(credit.dinero),
      });
      debitPQ.add({ id: debit.id, dinero: amountLeft });
    } else {
      transfers.push({
        from: debit.id,
        to: credit.id,
        money: dineroToMoney(credit.dinero),
      });
    }
  }

  // verify

  const balanceVerification = Object.fromEntries(
    Object.entries(balanceRecord).map(([id, money]) => [
      id,
      moneyToDinero(money),
    ]),
  );

  for (const transfer of transfers) {
    balanceVerification[transfer.from] = add(
      balanceVerification[transfer.from]!,
      moneyToDinero(transfer.money),
    );
    balanceVerification[transfer.to] = subtract(
      balanceVerification[transfer.to]!,
      moneyToDinero(transfer.money),
    );
  }

  if (
    Object.entries(balanceVerification).some(([_, dinero]) => !isZero(dinero))
  ) {
    throw new Error("Assertion error: resolved balances do not sum to zero");
  }

  return transfers;
};
