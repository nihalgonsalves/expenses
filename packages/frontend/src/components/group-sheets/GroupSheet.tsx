import { MdListAlt } from 'react-icons/md';
import { Link } from 'react-router-dom';

import type { GroupSheetByIdResponse } from '@nihalgonsalves/expenses-shared/types/sheet';

import { trpc } from '../../api/trpc';

import { AddMemberButton } from './AddMemberButton';
import { type ActorInfo, BalanceSummary } from './BalanceSummary';
import { GroupSheetTransactionsDenseList } from './GroupSheetTransactionsDenseList';

export const GroupSheet = ({
  groupSheet,
  actorInfo,
}: {
  groupSheet: GroupSheetByIdResponse;
  actorInfo: ActorInfo | undefined;
}) => {
  const { data: groupSheetTransactionsResponse } =
    trpc.transaction.getGroupSheetTransactions.useQuery({
      groupSheetId: groupSheet.id,
    });

  return (
    <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
      <div className="flex flex-col flex-grow gap-4 card card-compact card-bordered">
        <div className="card-body">
          <h2 className="card-title">People</h2>

          {actorInfo && (
            <BalanceSummary
              groupSheetId={groupSheet.id}
              actorInfo={actorInfo}
            />
          )}

          {actorInfo?.isAdmin && (
            <AddMemberButton groupSheetId={groupSheet.id} />
          )}
        </div>
      </div>

      <div className="flex flex-col flex-grow gap-4 card card-compact card-bordered">
        <div className="card-body">
          <h2 className="card-title">Latest Transactions</h2>

          {groupSheetTransactionsResponse &&
          groupSheetTransactionsResponse.transactions.length > 0 ? (
            <>
              <GroupSheetTransactionsDenseList
                transactions={groupSheetTransactionsResponse.transactions.slice(
                  0,
                  4,
                )}
              />
              <Link
                to={`/groups/${groupSheet.id}/expenses`}
                className="btn btn-primary btn-outline"
              >
                <MdListAlt /> All Transactions (
                {groupSheetTransactionsResponse.total})
              </Link>
            </>
          ) : (
            <div className="alert">No transactions yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
