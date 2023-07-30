import { trpc } from '../../../api/trpc';
import { EditExpenseForm } from '../../../components/EditExpenseForm';
import { GroupParams, useParams } from '../../../router';
import { Root } from '../../Root';

export const NewGroupExpensePage = () => {
  const { groupSheetId } = useParams(GroupParams);
  const { data: groupSheet } = trpc.sheet.groupSheetById.useQuery(groupSheetId);

  const { data: me } = trpc.user.me.useQuery();

  if (!groupSheet || !me) {
    return null;
  }

  return (
    <Root title="Add Expense" showBackButton>
      <EditExpenseForm groupSheet={groupSheet} me={me} />
    </Root>
  );
};
