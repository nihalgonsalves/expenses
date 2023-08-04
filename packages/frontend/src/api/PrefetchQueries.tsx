import { trpc } from './trpc';
import { useCurrentUser } from './useCurrentUser';

export const PrefetchQueries = () => {
  const { data: me } = useCurrentUser();
  const enabled = me != null;

  trpc.expense.getAllUserExpenses.useQuery({}, { enabled });

  trpc.sheet.myGroupSheets.useQuery(undefined, { enabled });
  trpc.sheet.myPersonalSheets.useQuery(undefined, { enabled });

  trpc.notification.getSubscriptions.useQuery(undefined, { enabled });
  trpc.notification.getPublicKey.useQuery(undefined, { enabled });

  return null;
};
