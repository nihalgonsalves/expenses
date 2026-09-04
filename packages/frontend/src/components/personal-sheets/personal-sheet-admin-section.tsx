import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArchiveIcon, Trash2Icon } from "lucide-react";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

import { currencyConversionQueries } from "../../api/currency-conversion";
import { sheetMutations, sheetQueries } from "../../api/sheet";
import { useQueryClient } from "../../api/query-client";
import { ConfirmDialog } from "../form/confirm-dialog";
import { Button } from "../ui/button";

export const PersonalSheetAdminSection = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const navigate = useNavigate();

  const { invalidate } = useQueryClient();
  const { mutateAsync: deleteSheet } = useMutation(
    sheetMutations.deleteSheet(),
  );
  const { mutateAsync: archiveSheet } = useMutation(
    sheetMutations.archiveSheet(),
  );

  const handleDelete = async () => {
    await deleteSheet(personalSheet.id);

    await invalidate(
      sheetQueries.personalSheetById.queryKey(personalSheet.id),
      currencyConversionQueries.supportedCurrencies.queryKey(),
      sheetQueries.mySheets.queryKey(),
    );
    await navigate({ to: "/sheets" });
  };

  const handleArchive = async () => {
    await archiveSheet({
      sheetId: personalSheet.id,
      isArchived: !personalSheet.isArchived,
    });

    await invalidate(
      sheetQueries.personalSheetById.queryKey(personalSheet.id),
      sheetQueries.mySheets.queryKey(),
    );
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={handleArchive}>
        <ArchiveIcon className="mr-2" />
        {personalSheet.isArchived ? "Unarchive" : "Archive"}
      </Button>

      <ConfirmDialog
        confirmLabel="Confirm Delete"
        description="Are you sure you want to delete this sheet? This action is irreversible."
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
