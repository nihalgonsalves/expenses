import { MdPlaylistAdd } from 'react-icons/md';

import { trpc } from '../../../api/trpc';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { GroupSheetTransactionsExpandedList } from '../../../components/group-sheets/GroupSheetTransactionsExpandedList';
import { GroupParams, useParams } from '../../../router';
import { RootLoader } from '../../Root';

export const GroupExpensesIndexPage = () => {
  const { groupSheetId } = useParams(GroupParams);
  const result = trpc.transaction.getGroupSheetTransactions.useQuery({
    groupSheetId,
  });

  return (
    <RootLoader
      result={result}
      title="Transactions"
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/groups/${groupSheetId}/expenses/new`}
          label="Add Transaction"
          icon={<MdPlaylistAdd />}
        />
      }
      render={({ transactions }) => (
        <GroupSheetTransactionsExpandedList
          groupSheetId={groupSheetId}
          transactions={transactions}
        />
      )}
    />
  );
};
