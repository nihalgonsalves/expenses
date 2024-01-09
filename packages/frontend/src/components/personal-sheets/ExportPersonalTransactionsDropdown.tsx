import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

import { trpc } from "../../api/trpc";
import { moneyToString } from "../../utils/money";
import { ExportTransactionsDropdown } from "../ExportTransactionsDropdown";

export const ExportPersonalTransactionsDropdown = ({
  personalSheet,
}: {
  personalSheet: Pick<Sheet, "id" | "name">;
}) => {
  const { refetch } = trpc.transaction.getPersonalSheetTransactions.useQuery(
    {
      personalSheetId: personalSheet.id,
    },
    { enabled: false },
  );

  return (
    <ExportTransactionsDropdown
      id={personalSheet.id}
      name={personalSheet.name}
      fetch={async () => {
        const { data } = await refetch({ throwOnError: true });

        // should not be possible with throwOnError: true
        if (!data) throw new Error("Unknown Error");

        return data.transactions;
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
