import { trpc } from "./trpc";

export const useCurrentUser = () => trpc.user.me.useQuery();
