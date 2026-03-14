"use no memo";

import type { Row } from "@tanstack/react-table";

import type { ConvertedTransactionWithSheet } from "../../api/use-all-user-transactions";
import { getGroupSheetTransactionSummaryText } from "../../utils/utils";
import { Avatar } from "../avatar";
import { CurrencySpan } from "../currency-span";
import { ParticipantListItem } from "../group-sheets/participant-list-item";
import { Badge } from "../ui/badge";

type DataTableExpandedRowProps = {
  row: Row<ConvertedTransactionWithSheet>;
};

const noContent = <div className="p-4">No additional info</div>;

const GroupTransactionContent = ({
  transaction,
}: {
  transaction: ConvertedTransactionWithSheet & { sheetType: "GROUP" };
}) => (
  <>
    {transaction.type === "TRANSFER" ? (
      <div>{getGroupSheetTransactionSummaryText(transaction)}</div>
    ) : (
      <div className="flex flex-col gap-4 p-4">
        {transaction.participants.map(({ id, name, balance }) => (
          <ParticipantListItem key={id} avatar={<Avatar name={name} />}>
            <div className="flex flex-col">
              <div>
                <span className="font-semibold">{name}</span>
                {balance.actual.amount !== 0 && (
                  <>
                    {transaction.type === "EXPENSE" ? " paid " : " received "}
                    <Badge>
                      <CurrencySpan
                        money={balance.actual}
                        signDisplay="never"
                      />
                    </Badge>
                  </>
                )}
              </div>
              <div>
                <Badge variant="secondary">
                  <CurrencySpan money={balance.share} signDisplay="never" />
                </Badge>
              </div>
            </div>
          </ParticipantListItem>
        ))}
      </div>
    )}
  </>
);

export const DataTableExpandedRow = ({ row }: DataTableExpandedRowProps) => {
  const transaction = row.original;

  if (transaction.sheetType === "GROUP") {
    return <GroupTransactionContent transaction={transaction} />;
  }

  return noContent;
};
