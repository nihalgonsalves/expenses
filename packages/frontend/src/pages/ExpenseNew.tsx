import { EditExpenseForm } from '../components/EditExpenseForm';
import { useGroup } from '../db/splitGroup';
import { GroupParams, useParams } from '../router';

export const ExpenseNew = () => {
  const { groupId } = useParams(GroupParams);
  const group = useGroup(groupId);

  if (!group) {
    return null;
  }

  return <EditExpenseForm group={group} />;
};
