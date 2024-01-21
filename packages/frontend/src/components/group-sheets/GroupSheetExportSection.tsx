import { DownloadIcon } from "@radix-ui/react-icons";
import { useCallback } from "react";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

import { requestExport } from "../../api/requestExport";
import { trpc } from "../../api/trpc";
import { moneyToString } from "../../utils/money";
import { getShortName } from "../../utils/utils";
import { Button } from "../ui/button";

export const GroupSheetExportSection = ({
  groupSheet,
}: {
  groupSheet: Sheet;
}) => {
  const { refetch } = trpc.transaction.getGroupSheetTransactions.useQuery(
    {
      groupSheetId: groupSheet.id,
    },
    { enabled: false },
  );

  const exportGroupSheet = useCallback(
    (filetype: "json" | "csv") => {
      void requestExport(
        groupSheet.id,
        groupSheet.name,
        filetype,
        async () => {
          const { data } = await refetch({ throwOnError: true });

          // should not be possible with throwOnError: true
          if (!data) throw new Error("Unknown Error");

          return data.transactions;
        },
        ({ id, type, category, description, spentAt, money, participants }) => {
          const participantColumns: Record<string, string> = {};

          participants.forEach(({ name, balance }) => {
            participantColumns[`${getShortName(name).toLowerCase()}_share`] =
              balance.share.amount === 0 ? "" : moneyToString(balance.share);

            participantColumns[
              `${getShortName(name).toLowerCase()}_paid_or_received`
            ] =
              balance.actual.amount === 0 ? "" : moneyToString(balance.actual);
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
        },
      );
    },
    [refetch, groupSheet],
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
