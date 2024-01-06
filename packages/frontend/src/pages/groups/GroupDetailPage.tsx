import {
  ArchiveIcon,
  DotsVerticalIcon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { useCurrentUser } from '../../api/useCurrentUser';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { ConfirmDialog } from '../../components/form/ConfirmDialog';
import type { ActorInfo } from '../../components/group-sheets/BalanceSummary';
import { CreateGroupSheetTransactionDialog } from '../../components/group-sheets/CreateGroupSheetTransactionDialog';
import { ExportGroupTransactionsDropdown } from '../../components/group-sheets/ExportGroupTransactionsDropdown';
import { GroupSheet } from '../../components/group-sheets/GroupSheet';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { SheetParams, useParams } from '../../router';
import { RootLoader } from '../Root';

export const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { sheetId } = useParams(SheetParams);

  const utils = trpc.useUtils();
  const result = trpc.sheet.groupSheetById.useQuery(sheetId);
  const { data: me } = useCurrentUser();

  const { mutateAsync: deleteGroupSheet } =
    trpc.sheet.deleteSheet.useMutation();
  const { mutateAsync: archiveSheet } = trpc.sheet.archiveSheet.useMutation();

  const handleDelete = useCallback(async () => {
    await deleteGroupSheet(sheetId);

    void utils.sheet.groupSheetById.invalidate(sheetId);
    void utils.sheet.mySheets.invalidate();

    navigate('/groups');
  }, [deleteGroupSheet, sheetId, navigate, utils]);

  const handleArchive = useCallback(async () => {
    await archiveSheet(sheetId);
    void utils.sheet.groupSheetById.invalidate(sheetId);
    void utils.sheet.mySheets.invalidate();
    navigate('/sheets');
  }, [archiveSheet, sheetId, navigate, utils]);

  const actorInfo: ActorInfo | undefined = useMemo(
    () =>
      me && result.data
        ? {
            id: me.id,
            isAdmin:
              result.data.participants.find(({ id }) => id === me.id)?.role ===
              'ADMIN',
          }
        : undefined,
    [result.data, me],
  );

  return (
    <RootLoader
      getTitle={(groupSheet) => groupSheet.name}
      result={result}
      className="p-2 md:p-5"
      render={(groupSheet) => (
        <GroupSheet actorInfo={actorInfo} groupSheet={groupSheet} />
      )}
      showBackButton
      additionalChildren={
        <CreateGroupSheetTransactionDialog
          sheetId={sheetId}
          trigger={
            <FloatingActionButton label="Add Transaction" icon={<PlusIcon />} />
          }
        />
      }
      rightNavBarItems={
        <DropdownMenu aria-label="Actions">
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
            {result.data && (
              <ExportGroupTransactionsDropdown groupSheet={result.data} />
            )}
            {actorInfo?.isAdmin && (
              <>
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
                  description="Are you sure you want to delete this group? This action is irreversible."
                  onConfirm={handleDelete}
                  variant="destructive"
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <TrashIcon className="mr-2" /> Delete Group
                    </DropdownMenuItem>
                  }
                />
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  );
};
