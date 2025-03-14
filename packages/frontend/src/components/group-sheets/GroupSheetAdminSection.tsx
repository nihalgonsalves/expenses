import { ArchiveIcon, TrashIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

import { useTRPC } from "../../api/trpc";
import { ConfirmDialog } from "../../components/form/ConfirmDialog";
import { Button } from "../ui/button";

export const GroupSheetAdminSection = ({
  groupSheet,
}: {
  groupSheet: Sheet;
}) => {
  const navigate = useNavigate();

  const { trpc, invalidate } = useTRPC();

  const { mutateAsync: deleteGroupSheet } = useMutation(
    trpc.sheet.deleteSheet.mutationOptions(),
  );
  const { mutateAsync: archiveSheet } = useMutation(
    trpc.sheet.archiveSheet.mutationOptions(),
  );

  const handleDelete = async () => {
    await deleteGroupSheet(groupSheet.id);

    void invalidate(
      trpc.sheet.groupSheetById.queryKey(groupSheet.id),
      trpc.sheet.mySheets.queryKey(),
    );

    await navigate({ to: "/sheets" });
  };

  const handleArchive = async () => {
    await archiveSheet({
      sheetId: groupSheet.id,
      isArchived: !groupSheet.isArchived,
    });

    void invalidate(
      trpc.sheet.groupSheetById.queryKey(groupSheet.id),
      trpc.sheet.mySheets.queryKey(),
    );
  };

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
