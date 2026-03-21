import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";

import { useTRPC } from "../../api/trpc";
import { FloatingActionButton } from "../floating-action-button";
import { ResponsiveDialog } from "../form/responsive-dialog";
import { CreateGroupSheetTransactionDialog } from "../group-sheets/create-group-sheet-transaction-dialog";
import { CreatePersonalTransactionDialog } from "../personal-sheets/create-personal-transaction-dialog";
import { Button } from "../ui/button";
import { haptics } from "bzzz";

export const QuickCreateTransactionFAB = () => {
  const { trpc } = useTRPC();
  const { data: sheets } = useQuery(
    trpc.sheet.mySheets.queryOptions({ includeArchived: false }),
  );

  return (
    <ResponsiveDialog
      triggerType="trigger"
      render={
        <FloatingActionButton label="Add Transaction" icon={<PlusIcon />} />
      }
      nativeButton={false}
      title="Choose a sheet"
    >
      <div className="mt-2 flex flex-col gap-4">
        {sheets?.length === 0 && "No unarchived sheets found"}
        {sheets?.map((sheet) =>
          sheet.type === "PERSONAL" ? (
            <CreatePersonalTransactionDialog
              key={sheet.id}
              sheetId={sheet.id}
              render={
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    haptics.selection();
                  }}
                >
                  {sheet.name}
                </Button>
              }
            />
          ) : (
            <CreateGroupSheetTransactionDialog
              key={sheet.id}
              sheetId={sheet.id}
              render={
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    haptics.selection();
                  }}
                >
                  {sheet.name}
                </Button>
              }
            />
          ),
        )}
      </div>
    </ResponsiveDialog>
  );
};
