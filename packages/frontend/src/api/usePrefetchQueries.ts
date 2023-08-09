import { trpc } from './trpc';
import { useCurrentUser } from './useCurrentUser';

export const usePrefetchQueries = () => {
  const { data: me } = useCurrentUser();
  const enabled = me != null;

  trpc.sheet.mySheets.useQuery(undefined, { enabled });

  trpc.notification.getSubscriptions.useQuery(undefined, { enabled });
  trpc.notification.getPublicKey.useQuery(undefined, { enabled });
};
