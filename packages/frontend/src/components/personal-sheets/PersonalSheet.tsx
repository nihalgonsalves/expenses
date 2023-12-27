import { Temporal } from '@js-temporal/polyfill';
import {
  DotsVerticalIcon,
  ListBulletIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
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
import { ConfirmDialog } from '../form/ConfirmDialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ScrollArea } from '../ui/scroll-area';

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
    <div className="flex flex-row items-center gap-4 text-sm">
      <CategoryAvatar category={transaction.category} />
      <div className="flex flex-col">
        <span>
          <strong>{descriptionText}</strong> {formatCurrency(transaction.money)}
        </span>
        <span>{description}</span>
      </div>
      <div className="grow" />
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <DotsVerticalIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="left">
        <ConfirmDialog
          confirmLabel="Confirm Delete"
          description="Delete transaction schedule? Existing transactions will not be affected."
          onConfirm={handleDelete}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <TrashIcon className="mr-2" /> Delete
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
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
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Latest Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ScrollArea className="max-h-96 overflow-y-auto">
            {getPersonalSheetTransactionsResponse?.transactions.map(
              (transaction) => (
                <TransactionListItemComponent
                  key={transaction.id}
                  transaction={transaction}
                  description={formatDateTimeRelative(transaction.spentAt)}
                />
              ),
            )}
          </ScrollArea>
          <Button variant="outline" asChild>
            <Link to={`/sheets/${personalSheet.id}/transactions`}>
              <ListBulletIcon className="mr-2" /> All Transactions (
              {getPersonalSheetTransactionsResponse?.total})
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Scheduled Transactions (
            {getPersonalSheetTransactionSchedulesResponse?.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
        </CardContent>
      </Card>
    </div>
  );
};
