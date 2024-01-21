import { ArchiveIcon, TrashIcon } from "@radix-ui/react-icons";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

import { trpc } from "../../api/trpc";
import { ConfirmDialog } from "../form/ConfirmDialog";
import { Button } from "../ui/button";

export const PersonalSheetAdminSection = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const navigate = useNavigate();

  const utils = trpc.useUtils();

  const { mutateAsync: deleteSheet } = trpc.sheet.deleteSheet.useMutation();
  const { mutateAsync: archiveSheet } = trpc.sheet.archiveSheet.useMutation();

  const handleDelete = useCallback(async () => {
    await deleteSheet(personalSheet.id);
    void utils.sheet.personalSheetById.invalidate(personalSheet.id);
    void utils.sheet.mySheets.invalidate();
    navigate("/sheets");
  }, [deleteSheet, personalSheet.id, navigate, utils]);

  const handleArchive = useCallback(async () => {
    await archiveSheet({
      sheetId: personalSheet.id,
      isArchived: !personalSheet.isArchived,
    });
    void utils.sheet.personalSheetById.invalidate(personalSheet.id);
    void utils.sheet.mySheets.invalidate();
  }, [archiveSheet, personalSheet, utils]);

  return (
    <>
      <Button type="button" $variant="outline" onClick={handleArchive}>
        <ArchiveIcon className="mr-2" />
        {personalSheet.isArchived ? "Unarchive" : "Archive"}
      </Button>

      <ConfirmDialog
        confirmLabel="Confirm Delete"
        description="Are you sure you want to delete this sheet? This action is irreversible."
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
