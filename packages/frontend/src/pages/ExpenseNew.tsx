import { trpc } from '../api/trpc';
import { EditExpenseForm } from '../components/EditExpenseForm';
import { GroupParams, useParams } from '../router';

export const ExpenseNew = () => {
  const { groupId } = useParams(GroupParams);
  const { data: group } = trpc.group.groupById.useQuery(groupId);

  if (!group) {
    return null;
  }

  return <EditExpenseForm group={group} />;
};
