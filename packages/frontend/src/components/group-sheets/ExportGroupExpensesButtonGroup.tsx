import type { Sheet } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../../api/trpc';
import { moneyToString } from '../../utils/money';
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
      }) => ({
        id,
        type,
        category,
        description,
        spent_at: spentAt,
        currency_code: money.currencyCode,
        amount: moneyToString(money),
        ...Object.fromEntries(
          participants.map(({ name, balance }) => [
            name.toLowerCase().replace(/[^\w]/g, '_'),
            moneyToString(balance),
          ]),
        ),
      })}
    />
  );
};
