import { DownloadIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";

import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";

import { requestExport } from "../../api/requestExport";
import { useTRPC } from "../../api/trpc";
import { moneyToString } from "../../utils/money";
import { getShortName } from "../../utils/utils";
import { Button } from "../ui/button";

export const GroupSheetExportSection = ({
  groupSheet,
}: {
  groupSheet: GroupSheetByIdResponse;
}) => {
  const { trpc } = useTRPC();
  const { refetch } = useQuery(
    trpc.transaction.getGroupSheetTransactions.queryOptions(
      {
        groupSheetId: groupSheet.id,
      },
      { enabled: false },
    ),
  );

  const baseColumns = [
    "id",
    "type",
    "category",
    "description",
    "spent_at",
    "currency_code",
    "amount",
  ] as const;

  const participantColumns = groupSheet.participants.flatMap(
    (participant) =>
      [
        `${getShortName(participant.name).toLowerCase()}_share`,
        `${getShortName(participant.name).toLowerCase()}_paid_or_received`,
      ] as const,
  );

  const columns = [...baseColumns, ...participantColumns] as const;

  const exportSheet = (filetype: "json" | "csv") => {
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
      ({
        id,
        type,
        category,
        description,
        spentAt,
        money,
        participants,
      }): Record<(typeof columns)[number], string> => {
        const participantData = new Map<
          (typeof participantColumns)[number],
          string
        >();

        participants.forEach(({ name, balance }) => {
          participantData.set(
            `${getShortName(name).toLowerCase()}_share`,
            balance.share.amount === 0 ? "" : moneyToString(balance.share),
          );

          participantData.set(
            `${getShortName(name).toLowerCase()}_paid_or_received`,
            balance.actual.amount === 0 ? "" : moneyToString(balance.actual),
          );
        });

        return {
          id,
          type,
          category,
          description,
          spent_at: spentAt,
          currency_code: money.currencyCode,
          amount: moneyToString(money),
          ...Object.fromEntries(participantData),
        };
      },
      columns,
    );
  };

  return (
    <>
      <Button
        type="button"
        $variant="outline"
        onClick={() => {
          exportSheet("json");
        }}
      >
        <DownloadIcon className="mr-2" /> Export .json
      </Button>
      <Button
        type="button"
        $variant="outline"
        onClick={() => {
          exportSheet("csv");
        }}
      >
        <DownloadIcon className="mr-2" /> Export .csv
      </Button>
    </>
  );
};
