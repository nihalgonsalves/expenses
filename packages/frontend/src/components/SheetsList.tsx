import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { PlusIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import type { SheetsResponse } from "@nihalgonsalves/expenses-shared/types/sheet";

import { Avatar } from "./Avatar";
import { ExpandMoreButton } from "./ExpandMoreButton";
import { NewGroupSheetDialog, NewPersonalSheetDialog } from "./NewSheetDialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { cn, twx } from "./ui/utils";

const partitionSheets = (sheets: SheetsResponse) => {
  const personal: SheetsResponse = [];
  const group: SheetsResponse = [];
  const archived: SheetsResponse = [];

  for (const sheet of sheets) {
    if (sheet.isArchived) {
      archived.push(sheet);
    } else if (sheet.type === "PERSONAL") {
      personal.push(sheet);
    } else {
      group.push(sheet);
    }
  }

  return { personal, group, archived };
};

const SheetItem = ({ sheet }: { sheet: SheetsResponse[0] }) => {
  const link =
    sheet.type === "PERSONAL" ? `/sheets/${sheet.id}` : `/groups/${sheet.id}`;

  return (
    <div key={sheet.id} className="flex h-14 items-center gap-4">
      <Button
        $variant="outline"
        className="text-primary grow justify-start gap-4 text-xl font-normal"
        asChild
      >
        <Link to={link}>{sheet.name}</Link>
      </Button>
      {sheet.type === "GROUP" && (
        <div className="flex -space-x-4">
          {sheet.participants.map((participant) => (
            <Avatar key={participant.id} name={participant.name} />
          ))}
        </div>
      )}
    </div>
  );
};

const CardTitleWithButton = twx(
  CardTitle,
)`flex place-items-center justify-between`;

export const SheetsList = ({ sheets }: { sheets: SheetsResponse }) => {
  const { personal, group, archived } = useMemo(
    () => partitionSheets(sheets),
    [sheets],
  );

  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitleWithButton>
            Personal Sheets
            <NewPersonalSheetDialog
              trigger={
                <Button $size="icon" $variant="outline">
                  <AccessibleIcon label="New personal sheet">
                    <PlusIcon />
                  </AccessibleIcon>
                </Button>
              }
            />
          </CardTitleWithButton>
        </CardHeader>
        <CardContent>
          {personal.map((sheet) => (
            <SheetItem key={sheet.id} sheet={sheet} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitleWithButton>
            Group Sheets
            <NewGroupSheetDialog
              trigger={
                <Button $size="icon" $variant="outline">
                  <AccessibleIcon label="New group sheet">
                    <PlusIcon />
                  </AccessibleIcon>
                </Button>
              }
            />
          </CardTitleWithButton>
        </CardHeader>
        <CardContent>
          {group.map((sheet) => (
            <SheetItem key={sheet.id} sheet={sheet} />
          ))}
        </CardContent>
      </Card>

      <Card className={cn(showArchived ? "" : "opacity-50")}>
        <Collapsible open={showArchived}>
          <CardHeader>
            <CardTitleWithButton>
              Archived Sheets
              <CollapsibleTrigger asChild>
                <ExpandMoreButton
                  expand={showArchived}
                  onClick={() => {
                    setShowArchived((prev) => !prev);
                  }}
                />
              </CollapsibleTrigger>
            </CardTitleWithButton>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {archived.map((sheet) => (
                <SheetItem key={sheet.id} sheet={sheet} />
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};
