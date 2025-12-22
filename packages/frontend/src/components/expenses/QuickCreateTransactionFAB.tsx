import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";

import { useTRPC } from "../../api/trpc";
import { FloatingActionButton } from "../FloatingActionButton";
import { ResponsiveDialog } from "../form/ResponsiveDialog";
import { CreateGroupSheetTransactionDialog } from "../group-sheets/CreateGroupSheetTransactionDialog";
import { CreatePersonalTransactionDialog } from "../personal-sheets/CreatePersonalTransactionDialog";
import { Button } from "../ui/button";

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
                <Button className="w-full" variant="outline">
                  {sheet.name}
                </Button>
              }
            />
          ) : (
            <CreateGroupSheetTransactionDialog
              key={sheet.id}
              sheetId={sheet.id}
              render={
                <Button className="w-full" variant="outline">
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
