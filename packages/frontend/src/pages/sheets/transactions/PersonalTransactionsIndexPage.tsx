import { PlusIcon } from '@radix-ui/react-icons';

import { trpc } from '../../../api/trpc';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { CreatePersonalTransactionDialog } from '../../../components/personal-sheets/CreatePersonalTransactionDialog';
import { PersonalSheetTransactionsExpandedList } from '../../../components/personal-sheets/PersonalSheetTransactionsExpandedList';
import { SheetParams, useParams } from '../../../router';
import { RootLoader } from '../../Root';

export const PersonalExpensesIndexPage = () => {
  const { sheetId } = useParams(SheetParams);
  const result = trpc.transaction.getPersonalSheetTransactions.useQuery({
    personalSheetId: sheetId,
  });

  return (
    <RootLoader
      result={result}
      title="Transactions"
      showBackButton
      additionalChildren={
        <CreatePersonalTransactionDialog
          sheetId={sheetId}
          trigger={
            <FloatingActionButton label="Add Transaction" icon={<PlusIcon />} />
          }
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
