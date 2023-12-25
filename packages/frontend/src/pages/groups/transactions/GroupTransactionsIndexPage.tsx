import { PlusIcon } from '@radix-ui/react-icons';

import { trpc } from '../../../api/trpc';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { GroupSheetTransactionsExpandedList } from '../../../components/group-sheets/GroupSheetTransactionsExpandedList';
import { SheetParams, useParams } from '../../../router';
import { RootLoader } from '../../Root';

export const GroupTransactionsIndexPage = () => {
  const { sheetId } = useParams(SheetParams);
  const result = trpc.transaction.getGroupSheetTransactions.useQuery({
    groupSheetId: sheetId,
  });

  return (
    <RootLoader
      result={result}
      title="Transactions"
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/groups/${sheetId}/transactions/new`}
          label="Add Transaction"
          icon={<PlusIcon />}
        />
      }
      render={({ transactions }) => (
        <GroupSheetTransactionsExpandedList
          groupSheetId={sheetId}
          transactions={transactions}
        />
      )}
    />
  );
};
