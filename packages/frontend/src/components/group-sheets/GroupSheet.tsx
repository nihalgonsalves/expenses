import { ListBulletIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

import type { GroupSheetByIdResponse } from '@nihalgonsalves/expenses-shared/types/sheet';

import { trpc } from '../../api/trpc';
import { Alert, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {actorInfo && (
            <BalanceSummary
              groupSheetId={groupSheet.id}
              actorInfo={actorInfo}
            />
          )}

          {actorInfo?.isAdmin && (
            <AddMemberButton groupSheetId={groupSheet.id} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {groupSheetTransactionsResponse &&
          groupSheetTransactionsResponse.transactions.length > 0 ? (
            <>
              <GroupSheetTransactionsDenseList
                transactions={groupSheetTransactionsResponse.transactions.slice(
                  0,
                  4,
                )}
              />
              <Button className="w-full" variant="outline" asChild>
                <Link to={`/groups/${groupSheet.id}/transactions`}>
                  <ListBulletIcon className="mr-2" /> All Transactions (
                  {groupSheetTransactionsResponse.total})
                </Link>
              </Button>
            </>
          ) : (
            <Alert>
              <AlertTitle>No transactions yet</AlertTitle>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
