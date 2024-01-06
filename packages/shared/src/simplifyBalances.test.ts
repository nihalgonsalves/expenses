import { describe, expect, it } from 'vitest';

import type { Money } from '@nihalgonsalves/expenses-shared/money';

import { type Transfer, simplifyBalances } from './simplifyBalances';

const currencyCode = 'EUR';
const scale = 2;

describe('simplifyBalances', () => {
  it('simplifies a simple condition', () => {
    const balances: Record<string, Money> = {
      alice: { amount: 10_00, scale, currencyCode },
      bob: { amount: -10_00, scale, currencyCode },
    };

    expect(simplifyBalances(currencyCode, balances)).toMatchObject<Transfer[]>([
      {
        from: 'bob',
        to: 'alice',
        money: { amount: 10_00, scale, currencyCode },
      },
    ]);
  });

  it('simplifies a simple 3-person condition', () => {
    const balances: Record<string, Money> = {
      alice: { amount: 10_00, scale, currencyCode },
      bob: { amount: 10_00, scale, currencyCode },
      charlie: { amount: -20_00, scale, currencyCode },
    };

    expect(simplifyBalances(currencyCode, balances)).toMatchObject<Transfer[]>([
      {
        from: 'charlie',
        to: 'alice',
        money: { amount: 10_00, scale, currencyCode },
      },
      {
        from: 'charlie',
        to: 'bob',
        money: { amount: 10_00, scale, currencyCode },
      },
    ]);
  });

  it('simplifies a transitive condition', () => {
    const balances: Record<string, Money> = {
      alice: { amount: -25_00, scale, currencyCode },
      bob: { amount: 10_00, scale, currencyCode },
      charlie: { amount: 15_00, scale, currencyCode },
    };

    expect(simplifyBalances(currencyCode, balances)).toMatchObject<Transfer[]>([
      {
        from: 'alice',
        to: 'charlie',
        money: { amount: 15_00, scale, currencyCode },
      },
      {
        from: 'alice',
        to: 'bob',
        money: { amount: 10_00, scale, currencyCode },
      },
    ]);
  });
});
