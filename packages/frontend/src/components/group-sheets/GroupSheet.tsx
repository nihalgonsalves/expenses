import { useMemo } from 'react';
import { MdDeleteOutline, MdListAlt } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';

import type { GroupSheetByIdResponse } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../../api/trpc';
import { useCurrentUser } from '../../api/useCurrentUser';
import { ConfirmButton } from '../form/ConfirmButton';

import { type ActorInfo, BalanceSummary } from './BalanceSummary';
import { ExportGroupExpensesButtonGroup } from './ExportGroupExpensesButtonGroup';
import { GroupSheetExpensesDenseList } from './GroupSheetExpensesDenseList';

export const GroupSheet = ({
  groupSheet,
}: {
  groupSheet: GroupSheetByIdResponse;
}) => {
  const navigate = useNavigate();

  const utils = trpc.useContext();

  const { data: me } = useCurrentUser();
  const { data: groupSheetExpensesResponse } =
    trpc.expense.getGroupSheetExpenses.useQuery({
      groupSheetId: groupSheet.id,
      limit: 2,
    });

  const { mutateAsync: deleteGroupSheet, isLoading: deleteGroupLoading } =
    trpc.sheet.deleteSheet.useMutation();

  const handleDelete = async () => {
    await deleteGroupSheet(groupSheet.id);

    void utils.sheet.groupSheetById.invalidate(groupSheet.id);
    void utils.sheet.myGroupSheets.invalidate();

    navigate('/groups');
  };

  const actorInfo: ActorInfo | undefined = useMemo(
    () =>
      me
        ? {
            id: me.id,
            isAdmin:
              groupSheet.participants.find(({ id }) => id === me.id)?.role ===
              'ADMIN',
          }
        : undefined,
    [groupSheet, me],
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">People</h2>
      {actorInfo && (
        <BalanceSummary groupSheetId={groupSheet.id} actorInfo={actorInfo} />
      )}

      <div className="divider" />

      <h2 className="text-xl font-semibold">Latest Expenses</h2>

      <GroupSheetExpensesDenseList
        expenses={groupSheetExpensesResponse?.expenses ?? []}
      />
      <Link
        to={`/groups/${groupSheet.id}/expenses`}
        className="btn btn-primary btn-outline"
      >
        <MdListAlt /> All Expenses ({groupSheetExpensesResponse?.total})
      </Link>

      <div className="divider" />

      <ExportGroupExpensesButtonGroup groupSheet={groupSheet} />

      {actorInfo?.isAdmin && (
        <ConfirmButton
          isLoading={deleteGroupLoading}
          label={
            <>
              <MdDeleteOutline /> Delete Group
            </>
          }
          confirmLabel="Confirm Delete (Irreversible)"
          handleConfirmed={handleDelete}
        />
      )}
    </div>
  );
};
