import { epochNowSeconds, generateId } from '../utils/utils';

import { db } from './db';
import {
  type SplitGroupDocument,
  type SplitGroupExpense,
  ZSplitGroupExpense,
} from './types';
import { useRXDBQuery } from './util';

export const useGroup = (id: string): SplitGroupDocument | null => {
  const value = useRXDBQuery(() => db.split_groups.findOne(id).$, [id]);

  return value ?? null;
};

// TODO: Investigate RXDB populate / whether it works with TypeScript
export const getParticipantNamesById = (group: SplitGroupDocument) =>
  Object.fromEntries(
    [group.owner, ...group.participants].map(({ id, name }) => [id, name]),
  );

export const addExpense = async (
  group: SplitGroupDocument,
  input: Omit<SplitGroupExpense, 'id' | 'createdAt'>,
) => {
  const parsedExpense = ZSplitGroupExpense.parse({
    ...input,
    id: generateId(),
    createdAt: epochNowSeconds(),
  } satisfies SplitGroupExpense);

  const expense = await group.update({
    $push: {
      expenses: parsedExpense,
    },
  });

  return expense;
};
