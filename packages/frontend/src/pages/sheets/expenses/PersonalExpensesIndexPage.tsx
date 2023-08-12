import { MdPlaylistAdd } from 'react-icons/md';

import { trpc } from '../../../api/trpc';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { PersonalSheetTransactionsExpandedList } from '../../../components/personal-sheets/PersonalSheetTransactionsExpandedList';
import { PersonalSheetParams, useParams } from '../../../router';
import { RootLoader } from '../../Root';

export const PersonalExpensesIndexPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const result = trpc.transaction.getPersonalSheetTransactions.useQuery({
    personalSheetId: sheetId,
  });

  return (
    <RootLoader
      result={result}
      title="Transactions"
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/sheets/${sheetId}/expenses/new`}
          label="Add Transaction"
          icon={<MdPlaylistAdd />}
        />
      }
      render={({ transactions }) => (
        <PersonalSheetTransactionsExpandedList
          personalSheetId={sheetId}
          transactions={transactions}
        />
      )}
    />
  );
};
