import { trpc } from '../../api/trpc';
import { EditExpenseForm } from '../../components/EditExpenseForm';
import { GroupParams, useParams } from '../../router';
import { Root } from '../Root';

export const NewExpensePage = () => {
  const { groupId } = useParams(GroupParams);
  const { data: group } = trpc.group.groupById.useQuery(groupId);

  const { data: me } = trpc.user.me.useQuery();

  if (!group || !me) {
    return null;
  }

  return (
    <Root title="Add Expense" showBackButton>
      <EditExpenseForm group={group} me={me} />
    </Root>
  );
};
