import { epochNowSeconds, generateId } from '../utils/utils';

import { db } from './db';
import {
  ZSplitGroup,
  type SplitGroup,
  type SplitGroupDocument,
  type SplitGroupExpense,
  ZSplitGroupExpense,
  type SplitGroupParticipant,
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

// TODO: Investigate RXDB populate / whether it works with TypeScript
export const getParticipantNamesById = (group: SplitGroupDocument) =>
  Object.fromEntries(
    [group.owner, ...group.participants].map(({ id, name }) => [id, name]),
  );

const addId = <T>(obj: T): T & { id: string } => ({
  ...obj,
  id: generateId(),
});

export const createGroup = async ({
  owner,
  participants,
  ...input
}: Omit<SplitGroup, 'id' | 'createdAt' | 'owner' | 'participants'> & {
  owner: Omit<SplitGroupParticipant, 'id'>;
  participants: Omit<SplitGroupParticipant, 'id'>[];
}): Promise<SplitGroupDocument> => {
  const parsedGroup = ZSplitGroup.parse({
    ...input,
    id: generateId(),
    createdAt: epochNowSeconds(),
    owner: addId(owner),
    participants: participants.map((participant) => addId(participant)),
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
