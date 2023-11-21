import { trpc } from '../../../api/trpc';
import { EditPersonalTransactionForm } from '../../../components/personal-sheets/EditPersonalTransactionForm';
import { TransactionParams, useParams } from '../../../router';
import { RootLoader } from '../../Root';

export const EditPersonalSheetTransactionPage = () => {
  const { sheetId, transactionId } = useParams(TransactionParams);
  const result = trpc.transaction.getTransaction.useQuery({
    sheetId,
    transactionId,
  });

  return (
    <RootLoader
      title="Edit Transaction"
      showBackButton
      render={({ transaction, sheet }) => (
        <EditPersonalTransactionForm
          transaction={transaction}
          personalSheet={sheet}
        />
      )}
      result={result}
    />
  );
};
