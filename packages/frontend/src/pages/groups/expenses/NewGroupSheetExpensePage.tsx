import { trpc } from '../../../api/trpc';
import { useCurrentUser } from '../../../api/useCurrentUser';
import { CreateGroupSheetTransactionForm } from '../../../components/group-sheets/CreateGroupSheetTransactionForm';
import { GroupParams, useParams } from '../../../router';
import { Root } from '../../Root';

export const NewGroupSheetExpensePage = () => {
  const { groupSheetId } = useParams(GroupParams);
  const { data: groupSheet } = trpc.sheet.groupSheetById.useQuery(groupSheetId);

  const { data: me } = useCurrentUser();

  if (!groupSheet || !me) {
    return null;
  }

  return (
    <Root title="Add Transaction" showBackButton>
      <CreateGroupSheetTransactionForm groupSheet={groupSheet} me={me} />
    </Root>
  );
};
