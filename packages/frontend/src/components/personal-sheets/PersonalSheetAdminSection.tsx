import { ArchiveIcon, TrashIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

import { useTRPC } from "../../api/trpc";
import { ConfirmDialog } from "../form/ConfirmDialog";
import { Button } from "../ui/button";

export const PersonalSheetAdminSection = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const navigate = useNavigate();

  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: deleteSheet } = useMutation(
    trpc.sheet.deleteSheet.mutationOptions(),
  );
  const { mutateAsync: archiveSheet } = useMutation(
    trpc.sheet.archiveSheet.mutationOptions(),
  );

  const handleDelete = useCallback(async () => {
    await deleteSheet(personalSheet.id);

    await invalidate(
      trpc.sheet.personalSheetById.queryKey(personalSheet.id),
      trpc.sheet.mySheets.queryKey(),
    );
    await navigate({ to: "/sheets" });
  }, [deleteSheet, personalSheet.id, navigate, trpc, invalidate]);

  const handleArchive = useCallback(async () => {
    await archiveSheet({
      sheetId: personalSheet.id,
      isArchived: !personalSheet.isArchived,
    });

    await invalidate(
      trpc.sheet.personalSheetById.queryKey(personalSheet.id),
      trpc.sheet.mySheets.queryKey(),
    );
  }, [archiveSheet, personalSheet, trpc, invalidate]);

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
