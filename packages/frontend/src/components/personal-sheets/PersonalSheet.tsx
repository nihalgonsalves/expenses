import { MdListAlt } from 'react-icons/md';
import { Link } from 'react-router-dom';

import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../../api/trpc';
import { formatCurrency } from '../../utils/money';
import {
  formatDateTimeRelative,
  getTransactionDescription,
} from '../../utils/utils';
import { CategoryAvatar } from '../CategoryAvatar';

const TransactionListItemComponent = ({
  transaction,
}: {
  transaction: TransactionListItem;
}) => {
  const descriptionText = getTransactionDescription(transaction);
  return (
    <div className="flex flex-row gap-4 text-sm">
      <CategoryAvatar category={transaction.category} />
      <div className="flex flex-col">
        <span>
          <strong>{descriptionText}</strong> {formatCurrency(transaction.money)}
        </span>
        <span>{formatDateTimeRelative(transaction.spentAt)}</span>
      </div>
    </div>
  );
};

export const PersonalSheet = ({ personalSheet }: { personalSheet: Sheet }) => {
  const { data: getPersonalSheetTransactionsResponse } =
    trpc.transaction.getPersonalSheetTransactions.useQuery({
      personalSheetId: personalSheet.id,
    });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Latest Transactions</h2>

      {getPersonalSheetTransactionsResponse?.transactions
        .slice(0, 4)
        .map((transaction) => (
          <TransactionListItemComponent
            key={transaction.id}
            transaction={transaction}
          />
        ))}

      <Link
        to={`/sheets/${personalSheet.id}/expenses`}
        className="btn btn-primary btn-outline "
      >
        <MdListAlt /> All Transactions (
        {getPersonalSheetTransactionsResponse?.total})
      </Link>
    </div>
  );
};
