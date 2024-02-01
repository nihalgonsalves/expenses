import { DownloadIcon } from "@radix-ui/react-icons";
import { useCallback } from "react";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

import { requestExport } from "../../api/requestExport";
import { trpc } from "../../api/trpc";
import { moneyToString } from "../../utils/money";
import { Button } from "../ui/button";

export const PersonalSheetExportSection = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const { refetch } = trpc.transaction.getPersonalSheetTransactions.useQuery(
    {
      personalSheetId: personalSheet.id,
    },
    { enabled: false },
  );

  const exportGroupSheet = useCallback(
    (filetype: "json" | "csv") => {
      void requestExport(
        personalSheet.id,
        personalSheet.name,
        filetype,
        async () => {
          const { data } = await refetch({ throwOnError: true });

          // should not be possible with throwOnError: true
          if (!data) throw new Error("Unknown Error");

          return data.transactions;
        },
        ({ id, category, description, spentAt, money }) => ({
          id,
          category,
          description,
          spent_at: spentAt,
          currency_code: money.currencyCode,
          amount_decimal: moneyToString(money),
          money_amount: money.amount,
          money_scale: money.scale,
        }),
      );
    },
    [refetch, personalSheet],
  );

  return (
    <>
      <Button
        type="button"
        $variant="outline"
        onClick={() => {
          exportGroupSheet("json");
        }}
      >
        <DownloadIcon className="mr-2" /> Export .json
      </Button>
      <Button
        type="button"
        $variant="outline"
        onClick={() => {
          exportGroupSheet("csv");
        }}
      >
        <DownloadIcon className="mr-2" /> Export .csv
      </Button>
    </>
  );
};