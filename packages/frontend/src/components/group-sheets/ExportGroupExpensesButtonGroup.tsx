import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';

import { trpc } from '../../api/trpc';
import { moneyToString } from '../../utils/money';
import { getShortName } from '../../utils/utils';
import { ExportExpensesButtonGroup } from '../ExportExpensesButtonGroup';

export const ExportGroupExpensesButtonGroup = ({
  groupSheet,
}: {
  groupSheet: Pick<Sheet, 'id' | 'name'>;
}) => {
  const { refetch } = trpc.expense.getGroupSheetExpenses.useQuery(
    {
      groupSheetId: groupSheet.id,
    },
    { enabled: false },
  );

  return (
    <ExportExpensesButtonGroup
      id={groupSheet.id}
      name={groupSheet.name}
      fetch={async () => {
        const { data } = await refetch({ throwOnError: true });

        // should not be possible with throwOnError: true
        if (!data) throw new Error('Unknown Error');

        return data.expenses;
      }}
      mapItem={({
        id,
        type,
        category,
        description,
        spentAt,
        money,
        participants,
      }) => {
        const participantColumns: Record<string, string> = {};

        participants.forEach(({ name, balance }) => {
          participantColumns[`${getShortName(name).toLowerCase()}_share`] =
            balance.share.amount === 0 ? '' : moneyToString(balance.share);

          participantColumns[
            `${getShortName(name).toLowerCase()}_paid_or_received`
          ] = balance.actual.amount === 0 ? '' : moneyToString(balance.actual);
        });

        return {
          id,
          type,
          category,
          description,
          spent_at: spentAt,
          currency_code: money.currencyCode,
          amount: moneyToString(money),
          ...participantColumns,
        };
      }}
    />
  );
};
