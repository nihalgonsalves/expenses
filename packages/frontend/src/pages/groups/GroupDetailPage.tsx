import { useCallback, useMemo } from 'react';
import {
  MdDeleteOutline,
  MdMoreVert,
  MdOutlineArchive,
  MdPlaylistAdd,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { useCurrentUser } from '../../api/useCurrentUser';
import { DropdownMenu } from '../../components/DropdownMenu';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { ConfirmDialog } from '../../components/form/ConfirmDialog';
import type { ActorInfo } from '../../components/group-sheets/BalanceSummary';
import { ExportGroupTransactionsDropdown } from '../../components/group-sheets/ExportGroupTransactionsDropdown';
import { GroupSheet } from '../../components/group-sheets/GroupSheet';
import { GroupParams, useParams } from '../../router';
import { RootLoader } from '../Root';

export const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { groupSheetId } = useParams(GroupParams);

  const utils = trpc.useContext();
  const result = trpc.sheet.groupSheetById.useQuery(groupSheetId);
  const { data: me } = useCurrentUser();

  const { mutateAsync: deleteGroupSheet } =
    trpc.sheet.deleteSheet.useMutation();
  const { mutateAsync: archiveSheet } = trpc.sheet.archiveSheet.useMutation();

  const handleDelete = useCallback(async () => {
    await deleteGroupSheet(groupSheetId);

    void utils.sheet.groupSheetById.invalidate(groupSheetId);
    void utils.sheet.mySheets.invalidate();

    navigate('/groups');
  }, [deleteGroupSheet, groupSheetId, navigate, utils]);

  const handleArchive = useCallback(async () => {
    await archiveSheet(groupSheetId);
    void utils.sheet.groupSheetById.invalidate(groupSheetId);
    void utils.sheet.mySheets.invalidate();
    navigate('/sheets');
  }, [archiveSheet, groupSheetId, navigate, utils]);

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
      result={result}
      getTitle={(groupSheet) => groupSheet.name}
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/groups/${groupSheetId}/expenses/new`}
          label="Add Transaction"
          icon={<MdPlaylistAdd />}
        />
      }
      rightNavBarItems={
        <DropdownMenu icon={<MdMoreVert />} aria-label="Actions">
          {result.data && (
            <ExportGroupTransactionsDropdown groupSheet={result.data} />
          )}
          {actorInfo?.isAdmin && (
            <>
              <ConfirmDialog
                confirmLabel="Confirm Delete"
                description="Are you sure you want to delete this group? This action is irreversible."
                onConfirm={handleDelete}
                renderButton={(onClick) => (
                  <li>
                    <a onClick={onClick}>
                      <MdDeleteOutline /> Delete Group
                    </a>
                  </li>
                )}
              />

              <ConfirmDialog
                confirmLabel="Confirm Archive"
                description="Are you sure you want to archive this sheet?"
                onConfirm={handleArchive}
                renderButton={(onClick) => (
                  <li>
                    <a onClick={onClick}>
                      <MdOutlineArchive /> Archive Sheet
                    </a>
                  </li>
                )}
              />
            </>
          )}
        </DropdownMenu>
      }
      render={(groupSheet) => (
        <GroupSheet actorInfo={actorInfo} groupSheet={groupSheet} />
      )}
    />
  );
};
