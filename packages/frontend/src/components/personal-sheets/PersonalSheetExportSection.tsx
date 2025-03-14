import { DownloadIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

import { requestExport } from "../../api/requestExport";
import { useTRPC } from "../../api/trpc";
import { moneyToString } from "../../utils/money";
import { Button } from "../ui/button";

export const PersonalSheetExportSection = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const { trpc } = useTRPC();
  const { refetch } = useQuery(
    trpc.transaction.getPersonalSheetTransactions.queryOptions(
      {
        personalSheetId: personalSheet.id,
      },
      { enabled: false },
    ),
  );

  const exportGroupSheet = (filetype: "json" | "csv") => {
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
  };

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
