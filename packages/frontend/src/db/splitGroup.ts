import { generateId } from '../utils';

import { db } from './db';
import { type SplitGroup, type SplitGroupDocument } from './types';
import { useRXDBQuery } from './util';

export const useGroups = (): SplitGroup[] => {
  const value = useRXDBQuery(() => db.split_groups.find().$, []);
  return value ?? [];
};

export const useGroup = (id: string): SplitGroup | null => {
  const value = useRXDBQuery(() => db.split_groups.findOne(id).$, [id]);

  return value ?? null;
};

export const createGroup = async (
  input: Omit<SplitGroup, 'id'>,
): Promise<SplitGroupDocument> => {
  const group = await db.collections.split_groups.insert({
    ...input,
    id: generateId(),
  });

  return group;
};
