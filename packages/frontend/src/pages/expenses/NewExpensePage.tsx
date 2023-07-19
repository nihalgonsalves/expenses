import { trpc } from '../../api/trpc';
import { EditExpenseForm } from '../../components/EditExpenseForm';
import { GroupParams, useParams } from '../../router';
import { Root } from '../Root';

export const NewExpensePage = () => {
  const { groupId } = useParams(GroupParams);
  const { data: group } = trpc.group.groupById.useQuery(groupId);

  if (!group) {
    return null;
  }

  return (
    <Root title="Add Expense" showBackButton>
      <EditExpenseForm group={group} />
    </Root>
  );
};
