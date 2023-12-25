import { Temporal } from '@js-temporal/polyfill';
import { ListBulletIcon, TrashIcon } from '@radix-ui/react-icons';
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
import { DropdownMenu } from '../DropdownMenu';
import { ConfirmDialog } from '../form/ConfirmDialog';

const TransactionListItemComponent = ({
  transaction,
  description,
  addons,
}: {
  transaction: Pick<TransactionListItem, 'category' | 'description' | 'money'>;
  description: React.ReactNode;
  addons?: React.ReactNode;
}) => {
  const descriptionText = getTransactionDescription(transaction);
  return (
    <div className="flex flex-row gap-4 items-center text-sm">
      <CategoryAvatar category={transaction.category} />
      <div className="flex flex-col">
        <span>
          <strong>{descriptionText}</strong> {formatCurrency(transaction.money)}
        </span>
        <span>{description}</span>
      </div>
      <div className="flex-grow" />
      {addons}
    </div>
  );
};

const TransactionScheduleDropdownMenu = ({
  sheetId,
  transactionScheduleId,
}: {
  sheetId: string;
  transactionScheduleId: string;
}) => {
  const utils = trpc.useUtils();
  const { mutateAsync: deleteTransactionSchedule } =
    trpc.transaction.deleteTransactionSchedule.useMutation();

  const handleDelete = async () => {
    await deleteTransactionSchedule({ sheetId, transactionScheduleId });
    await utils.transaction.getPersonalSheetTransactionSchedules.invalidate();
  };

  return (
    <DropdownMenu aria-label="Actions">
      <ConfirmDialog
        confirmLabel="Confirm Delete"
        description="Delete transaction schedule? Existing transactions will not be affected."
        onConfirm={handleDelete}
        renderButton={(onClick) => (
          <li>
            <a onClick={onClick}>
              <TrashIcon /> Delete
            </a>
          </li>
        )}
      />
    </DropdownMenu>
  );
};

export const PersonalSheet = ({ personalSheet }: { personalSheet: Sheet }) => {
  const { data: getPersonalSheetTransactionsResponse } =
    trpc.transaction.getPersonalSheetTransactions.useQuery({
      personalSheetId: personalSheet.id,
    });

  const { data: getPersonalSheetTransactionSchedulesResponse } =
    trpc.transaction.getPersonalSheetTransactionSchedules.useQuery({
      personalSheetId: personalSheet.id,
    });

  return (
    <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
      <div className="flex flex-col flex-grow gap-4 card card-compact card-bordered">
        <div className="card-body">
          <h2 className="card-title">Latest Transactions</h2>

          {getPersonalSheetTransactionsResponse?.transactions
            .slice(0, 4)
            .map((transaction) => (
              <TransactionListItemComponent
                key={transaction.id}
                transaction={transaction}
                description={formatDateTimeRelative(transaction.spentAt)}
              />
            ))}

          <Link
            to={`/sheets/${personalSheet.id}/transactions`}
            className="btn btn-primary btn-outline "
          >
            <ListBulletIcon /> All Transactions (
            {getPersonalSheetTransactionsResponse?.total})
          </Link>
        </div>
      </div>

      <div className="flex flex-col flex-grow gap-4 card card-compact card-bordered">
        <div className="card-body">
          <h2 className="card-title">
            Scheduled Transactions (
            {getPersonalSheetTransactionSchedulesResponse?.length})
          </h2>

          {getPersonalSheetTransactionSchedulesResponse?.map((schedule) => (
            <TransactionListItemComponent
              key={schedule.id}
              transaction={schedule}
              description={
                <>
                  <span className="capitalize">
                    {schedule.recurrenceRule.freq.toLowerCase()}
                  </span>
                  ,{' next: '}
                  {formatDateTimeRelative(
                    Temporal.ZonedDateTime.from(
                      schedule.nextOccurrenceAt,
                    ).toInstant(),
                  )}
                </>
              }
              addons={
                <TransactionScheduleDropdownMenu
                  sheetId={personalSheet.id}
                  transactionScheduleId={schedule.id}
                />
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};
