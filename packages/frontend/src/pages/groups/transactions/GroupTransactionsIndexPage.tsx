import { PlusIcon } from "@radix-ui/react-icons";

import { trpc } from "../../../api/trpc";
import { FloatingActionButton } from "../../../components/FloatingActionButton";
import { CreateGroupSheetTransactionDialog } from "../../../components/group-sheets/CreateGroupSheetTransactionDialog";
import { GroupSheetTransactionsExpandedList } from "../../../components/group-sheets/GroupSheetTransactionsExpandedList";
import { SheetParams, useParams } from "../../../routes";
import { RootLoader } from "../../Root";

export const GroupTransactionsIndexPage = () => {
  const { sheetId } = useParams(SheetParams);
  const result = trpc.transaction.getGroupSheetTransactions.useQuery({
    groupSheetId: sheetId,
  });

  return (
    <RootLoader
      result={result}
      title="Transactions"
      showBackButton
      additionalChildren={
        <CreateGroupSheetTransactionDialog
          sheetId={sheetId}
          trigger={
            <FloatingActionButton label="Add Transaction" icon={<PlusIcon />} />
          }
        />
      }
      render={({ transactions }) => (
        <GroupSheetTransactionsExpandedList
          groupSheetId={sheetId}
          transactions={transactions}
        />
      )}
    />
  );
};
