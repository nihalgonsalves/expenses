import { ArchiveIcon, TrashIcon } from "@radix-ui/react-icons";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

import { trpc } from "../../api/trpc";
import { ConfirmDialog } from "../../components/form/ConfirmDialog";
import { Button } from "../ui/button";

export const GroupSheetAdminSection = ({
  groupSheet,
}: {
  groupSheet: Sheet;
}) => {
  const navigate = useNavigate();

  const utils = trpc.useUtils();

  const { mutateAsync: deleteGroupSheet } =
    trpc.sheet.deleteSheet.useMutation();
  const { mutateAsync: archiveSheet } = trpc.sheet.archiveSheet.useMutation();

  const handleDelete = useCallback(async () => {
    await deleteGroupSheet(groupSheet.id);

    void utils.sheet.groupSheetById.invalidate(groupSheet.id);
    void utils.sheet.mySheets.invalidate();

    navigate("/sheets");
  }, [deleteGroupSheet, groupSheet.id, navigate, utils]);

  const handleArchive = useCallback(async () => {
    await archiveSheet({
      sheetId: groupSheet.id,
      isArchived: !groupSheet.isArchived,
    });

    void utils.sheet.groupSheetById.invalidate(groupSheet.id);
    void utils.sheet.mySheets.invalidate();
  }, [archiveSheet, groupSheet, utils]);

  return (
    <>
      <Button type="button" $variant="outline" onClick={handleArchive}>
        <ArchiveIcon className="mr-2" />{" "}
        {groupSheet.isArchived ? "Unarchive" : "Archive"}
      </Button>

      <ConfirmDialog
        confirmLabel="Confirm Delete"
        description="Are you sure you want to delete this group? This action is irreversible."
        onConfirm={handleDelete}
        variant="destructive"
        trigger={
          <Button type="button" $variant="destructive">
            <TrashIcon className="mr-2" /> Delete
          </Button>
        }
      />
    </>
  );
};
