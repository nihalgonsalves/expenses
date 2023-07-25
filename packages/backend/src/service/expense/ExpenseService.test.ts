import { describe, it } from 'vitest';

describe('ExpenseService', () => {
  describe('createExpense', () => {
    it.todo('sends a notification to the participants, except the creator');

    it.todo("doesn't send a notification to participants not involved");

    it.todo('sends a notification to the payer, even if not a participant');
  });

  describe('createSettlement', () => {
    it.todo('sends a notification to the participants, except the creator');
  });
});
