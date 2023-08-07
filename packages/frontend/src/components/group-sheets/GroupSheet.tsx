import { useMemo } from 'react';
import { MdDeleteOutline, MdListAlt } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';

import type { GroupSheetByIdResponse } from '@nihalgonsalves/expenses-shared/types/sheet';

import { trpc } from '../../api/trpc';
import { useCurrentUser } from '../../api/useCurrentUser';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { ConfirmButton } from '../form/ConfirmButton';

import { type ActorInfo, BalanceSummary } from './BalanceSummary';
import { ExportGroupExpensesButtonGroup } from './ExportGroupExpensesButtonGroup';
import { GroupSheetExpensesDenseList } from './GroupSheetExpensesDenseList';

export const GroupSheet = ({
  groupSheet,
}: {
  groupSheet: GroupSheetByIdResponse;
}) => {
  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();

  const utils = trpc.useContext();

  const { data: me } = useCurrentUser();
  const { data: groupSheetExpensesResponse } =
    trpc.expense.getGroupSheetExpenses.useQuery({
      groupSheetId: groupSheet.id,
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
    <>
      <div className="flex flex-col md:grid md:grid-cols-2 md:gap-4">
        <div className="flex flex-col flex-grow gap-4">
          <h2 className="text-xl font-semibold">People</h2>
          {actorInfo && (
            <BalanceSummary
              groupSheetId={groupSheet.id}
              actorInfo={actorInfo}
            />
          )}
        </div>

        <div className="divider md:hidden" />

        <div className="flex flex-col flex-grow gap-4">
          <h2 className="text-xl font-semibold">Latest Expenses</h2>

          <GroupSheetExpensesDenseList
            expenses={groupSheetExpensesResponse?.expenses.slice(0, 2) ?? []}
          />
          <Link
            to={`/groups/${groupSheet.id}/expenses`}
            className="btn btn-primary btn-outline btn-block"
          >
            <MdListAlt /> All Expenses ({groupSheetExpensesResponse?.total})
          </Link>
        </div>
      </div>

      <div className="divider" />

      <div className="flex flex-col gap-4">
        <ExportGroupExpensesButtonGroup groupSheet={groupSheet} />

        {actorInfo?.isAdmin && (
          <ConfirmButton
            disabled={!onLine}
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
    </>
  );
};
