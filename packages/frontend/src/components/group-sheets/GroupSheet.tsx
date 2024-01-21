import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { ListBulletIcon, PlusIcon } from "@radix-ui/react-icons";
import { Link } from "react-router-dom";

import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";

import { trpc } from "../../api/trpc";
import { Alert, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { twx } from "../ui/utils";

import { AddMemberButton } from "./AddMemberButton";
import { type ActorInfo, BalanceSummary } from "./BalanceSummary";
import { CreateGroupSheetTransactionDialog } from "./CreateGroupSheetTransactionDialog";
import { GroupSheetAdminSection } from "./GroupSheetAdminSection";
import { GroupSheetExportSection } from "./GroupSheetExportSection";
import { GroupSheetFormSection } from "./GroupSheetFormSection";
import { GroupSheetTransactionsDenseList } from "./GroupSheetTransactionsDenseList";

const CardTitleWithButton = twx(
  CardTitle,
)`flex place-items-center justify-between`;

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
    <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitleWithButton>
            People
            {actorInfo?.isAdmin && (
              <AddMemberButton groupSheetId={groupSheet.id} />
            )}
          </CardTitleWithButton>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {actorInfo && (
            <BalanceSummary
              groupSheetId={groupSheet.id}
              actorInfo={actorInfo}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitleWithButton>
            Latest Transactions
            <CreateGroupSheetTransactionDialog
              sheetId={groupSheet.id}
              trigger={
                <Button $variant="outline" $size="icon">
                  <AccessibleIcon label="Add Transaction">
                    <PlusIcon />
                  </AccessibleIcon>
                </Button>
              }
            />
          </CardTitleWithButton>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {groupSheetTransactionsResponse &&
          groupSheetTransactionsResponse.transactions.length > 0 ? (
            <>
              <ScrollArea viewportClassName="max-h-96">
                <GroupSheetTransactionsDenseList
                  transactions={groupSheetTransactionsResponse.transactions}
                />
              </ScrollArea>
              <Button className="w-full" $variant="outline" asChild>
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

      <Card>
        <CardHeader>
          <CardTitle>Group Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <div>
            <GroupSheetFormSection groupSheet={groupSheet} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-2">
            <GroupSheetExportSection groupSheet={groupSheet} />
          </div>

          {actorInfo?.isAdmin && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <GroupSheetAdminSection groupSheet={groupSheet} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
