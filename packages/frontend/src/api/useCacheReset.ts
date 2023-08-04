import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { dexieCache } from './TrpcProvider';

export const useResetCache = () => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await dexieCache.queryCache.clear();
    await queryClient.invalidateQueries();
  }, [queryClient]);
};
