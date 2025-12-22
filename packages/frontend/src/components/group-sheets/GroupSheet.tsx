import { Link } from "@tanstack/react-router";
import { ActivityIcon } from "lucide-react";

import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { twx } from "../ui/utils";

import { AddMemberButton } from "./AddMemberButton";
import { type ActorInfo, BalanceSummary } from "./BalanceSummary";
import { GroupSheetAdminSection } from "./GroupSheetAdminSection";
import { GroupSheetExportSection } from "./GroupSheetExportSection";
import { GroupSheetFormSection } from "./GroupSheetFormSection";

const CardTitleWithButton = twx(
  CardTitle,
)`flex place-items-center justify-between`;

export const GroupSheet = ({
  groupSheet,
  actorInfo,
}: {
  groupSheet: GroupSheetByIdResponse;
  actorInfo: ActorInfo | undefined;
}) => (
  <div className="flex flex-col gap-2">
    <div className="p-2">
      <Button
        variant="outline"
        className="w-full"
        role="link"
        nativeButton={false}
        render={
          <Link to="/" search={{ sheetId: [groupSheet.id] }}>
            <ActivityIcon className="mr-2" /> Transactions
          </Link>
        }
      />
    </div>
    <div className="grid gap-2 md:grid-cols-2 md:gap-4">
      <Card>
        <CardHeader>
          <CardTitleWithButton>
            People
            {actorInfo?.isAdmin ? (
              <AddMemberButton groupSheetId={groupSheet.id} />
            ) : null}
          </CardTitleWithButton>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {actorInfo ? (
            <BalanceSummary
              groupSheetId={groupSheet.id}
              actorInfo={actorInfo}
            />
          ) : null}
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

          {actorInfo?.isAdmin ? (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <GroupSheetAdminSection groupSheet={groupSheet} />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  </div>
);
