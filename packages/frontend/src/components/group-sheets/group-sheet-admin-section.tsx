import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArchiveIcon, Trash2Icon } from "lucide-react";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

import { currencyConversionQueries } from "../../api/currency-conversion.functions";
import { sheetMutations, sheetQueries } from "../../api/sheet.functions";
import { useQueryClient } from "../../api/query-client";
import { ConfirmDialog } from "../form/confirm-dialog";
import { Button } from "../ui/button";

export const GroupSheetAdminSection = ({
  groupSheet,
}: {
  groupSheet: Sheet;
}) => {
  const navigate = useNavigate();

  const { invalidate } = useQueryClient();

  const { mutateAsync: deleteGroupSheet } = useMutation(
    sheetMutations.deleteSheet(),
  );
  const { mutateAsync: archiveSheet } = useMutation(
    sheetMutations.archiveSheet(),
  );

  const handleDelete = async () => {
    await deleteGroupSheet(groupSheet.id);

    void invalidate(
      sheetQueries.groupSheetById.queryKey(groupSheet.id),
      currencyConversionQueries.supportedCurrencies.queryKey(),
      sheetQueries.mySheets.queryKey(),
    );

    await navigate({ to: "/sheets" });
  };

  const handleArchive = async () => {
    await archiveSheet({
      sheetId: groupSheet.id,
      isArchived: !groupSheet.isArchived,
    });

    void invalidate(
      sheetQueries.groupSheetById.queryKey(groupSheet.id),
      sheetQueries.mySheets.queryKey(),
    );
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={handleArchive}>
        <ArchiveIcon className="mr-2" />{" "}
        {groupSheet.isArchived ? "Unarchive" : "Archive"}
      </Button>

      <ConfirmDialog
        confirmLabel="Confirm Delete"
        description="Are you sure you want to delete this group? This action is irreversible."
        onConfirm={handleDelete}
        variant="destructive"
        triggerType="trigger"
        render={
          <Button type="button" variant="destructive">
            <Trash2Icon className="mr-2" /> Delete
          </Button>
        }
      />
    </>
  );
};
