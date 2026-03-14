import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

/** mainly to re-set auth or profile state */
export const useInvalidateRouter = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async () => {
    await queryClient.invalidateQueries();
    await router.invalidate();
  };
};
