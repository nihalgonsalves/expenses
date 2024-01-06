import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import {
  ArchiveIcon,
  DotsVerticalIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { ConfirmDialog } from '../../components/form/ConfirmDialog';
import { ExportPersonalTransactionsDropdown } from '../../components/personal-sheets/ExportPersonalTransactionsDropdown';
import { PersonalSheet } from '../../components/personal-sheets/PersonalSheet';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/ui/dropdown-menu';
import { useParams, SheetParams } from '../../router';
import { RootLoader } from '../Root';

export const SheetDetailPage = () => {
  const { sheetId } = useParams(SheetParams);
  const result = trpc.sheet.personalSheetById.useQuery(sheetId);

  const navigate = useNavigate();

  const utils = trpc.useUtils();
  const { mutateAsync: deleteSheet } = trpc.sheet.deleteSheet.useMutation();
  const { mutateAsync: archiveSheet } = trpc.sheet.archiveSheet.useMutation();

  const handleDelete = useCallback(async () => {
    await deleteSheet(sheetId);
    void utils.sheet.personalSheetById.invalidate(sheetId);
    void utils.sheet.mySheets.invalidate();
    navigate('/sheets');
  }, [deleteSheet, sheetId, navigate, utils]);

  const handleArchive = useCallback(async () => {
    await archiveSheet(sheetId);
    void utils.sheet.personalSheetById.invalidate(sheetId);
    void utils.sheet.mySheets.invalidate();
    navigate('/sheets');
  }, [archiveSheet, sheetId, navigate, utils]);

  return (
    <RootLoader
      result={result}
      showBackButton
      getTitle={(sheet) => sheet.name}
      className="p-2 md:p-5"
      render={(sheet) => <PersonalSheet personalSheet={sheet} />}
      rightNavBarItems={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              $size="icon"
              $variant="ghost"
              className="text-primary-foreground"
            >
              <DotsVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link to={`/sheets/${sheetId}/import`}>
                <UploadIcon className="mr-2" />
                Import .csv
              </Link>
            </DropdownMenuItem>

            {result.data && (
              <ExportPersonalTransactionsDropdown personalSheet={result.data} />
            )}

            <ConfirmDialog
              confirmLabel="Confirm Archive"
              description="Are you sure you want to archive this sheet?"
              onConfirm={handleArchive}
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                >
                  <ArchiveIcon className="mr-2" /> Archive Sheet
                </DropdownMenuItem>
              }
            />

            <ConfirmDialog
              confirmLabel="Confirm Delete"
              description="Are you sure you want to delete this sheet? This action is irreversible."
              onConfirm={handleDelete}
              variant="destructive"
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                >
                  <TrashIcon className="mr-2" /> Delete Sheet
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      }
      additionalChildren={
        <FloatingActionButton
          to={`/sheets/${sheetId}/transactions/new`}
          label="Add Transaction"
          icon={<PlusIcon />}
        />
      }
    />
  );
};
