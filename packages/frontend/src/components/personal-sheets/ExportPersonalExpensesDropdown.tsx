import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';

import { trpc } from '../../api/trpc';
import { moneyToString } from '../../utils/money';
import { ExportExpensesDropdown } from '../ExportExpensesDropdown';

export const ExportPersonalExpensesDropdown = ({
  personalSheet,
}: {
  personalSheet: Pick<Sheet, 'id' | 'name'>;
}) => {
  const { refetch } = trpc.expense.getPersonalSheetExpenses.useQuery(
    {
      personalSheetId: personalSheet.id,
    },
    { enabled: false },
  );

  return (
    <ExportExpensesDropdown
      id={personalSheet.id}
      name={personalSheet.name}
      fetch={async () => {
        const { data } = await refetch({ throwOnError: true });

        // should not be possible with throwOnError: true
        if (!data) throw new Error('Unknown Error');

        return data.expenses;
      }}
      mapItem={({ id, category, description, spentAt, money }) => ({
        id,
        category,
        description,
        spent_at: spentAt,
        currency_code: money.currencyCode,
        amount_decimal: moneyToString(money),
        money_amount: money.amount,
        money_scale: money.scale,
      })}
    />
  );
};
