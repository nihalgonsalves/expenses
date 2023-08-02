import { trpc } from '../../../api/trpc';
import { CreateGroupSheetExpenseForm } from '../../../components/group-sheets/CreateGroupSheetExpenseForm';
import { GroupParams, useParams } from '../../../router';
import { Root } from '../../Root';

export const NewGroupSheetExpensePage = () => {
  const { groupSheetId } = useParams(GroupParams);
  const { data: groupSheet } = trpc.sheet.groupSheetById.useQuery(groupSheetId);

  const { data: me } = trpc.user.me.useQuery();

  if (!groupSheet || !me) {
    return null;
  }

  return (
    <Root title="Add Expense" showBackButton>
      <CreateGroupSheetExpenseForm groupSheet={groupSheet} me={me} />
    </Root>
  );
};
