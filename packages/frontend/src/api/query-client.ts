import {
  type QueryKey,
  useQueryClient as useTanStackQueryClient,
} from "@tanstack/react-query";

export const useQueryClient = () => {
  const queryClient = useTanStackQueryClient();

  const invalidate = async (...queryKeys: QueryKey[]) => {
    await Promise.all(
      queryKeys.map(async (queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
  };

  return { queryClient, invalidate };
};
