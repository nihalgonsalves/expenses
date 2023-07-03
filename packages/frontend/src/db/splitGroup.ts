import { epochNowSeconds, generateId } from '../utils';

import { db } from './db';
import {
  ZSplitGroup,
  type SplitGroup,
  type SplitGroupDocument,
  type SplitGroupExpense,
  ZSplitGroupExpense,
} from './types';
import { useRXDBQuery } from './util';

export const useGroups = (): SplitGroup[] => {
  const value = useRXDBQuery(() => db.split_groups.find().$, []);
  return value ?? [];
};

export const useGroup = (id: string): SplitGroupDocument | null => {
  const value = useRXDBQuery(() => db.split_groups.findOne(id).$, [id]);

  return value ?? null;
};

export const createGroup = async (
  input: Omit<SplitGroup, 'id' | 'createdAt'>,
): Promise<SplitGroupDocument> => {
  const parsedGroup = ZSplitGroup.parse({
    ...input,
    id: generateId(),
    createdAt: epochNowSeconds(),
  } satisfies SplitGroup);

  const group = await db.collections.split_groups.insert(parsedGroup);

  return group;
};

export const deleteGroup = async (splitGroupDocument: SplitGroupDocument) => {
  await splitGroupDocument.remove();
};

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
