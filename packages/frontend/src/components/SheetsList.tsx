import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { SheetsResponse } from '@nihalgonsalves/expenses-shared/types/sheet';

import { Avatar } from './Avatar';
import { ExpandMoreButton } from './ExpandMoreButton';
import { Alert, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { cn } from './ui/utils';

const partitionSheets = (sheets: SheetsResponse) => {
  const personal: SheetsResponse = [];
  const group: SheetsResponse = [];
  const archived: SheetsResponse = [];

  for (const sheet of sheets) {
    if (sheet.isArchived) {
      archived.push(sheet);
    } else if (sheet.type === 'PERSONAL') {
      personal.push(sheet);
    } else {
      group.push(sheet);
    }
  }

  return { personal, group, archived };
};

const SheetItem = ({ sheet }: { sheet: SheetsResponse[0] }) => {
  const link =
    sheet.type === 'PERSONAL' ? `/sheets/${sheet.id}` : `/groups/${sheet.id}`;

  return (
    <div key={sheet.id} className="flex h-14 items-center gap-4">
      <Button
        variant="outline"
        className="grow justify-start gap-4 text-xl font-normal text-primary"
        asChild
      >
        <Link to={link}>{sheet.name}</Link>
      </Button>
      {sheet.type === 'GROUP' && (
        <div className="flex -space-x-4">
          {sheet.participants.map((participant) => (
            <Avatar key={participant.id} name={participant.name} />
          ))}
        </div>
      )}
    </div>
  );
};

export const SheetsList = ({ sheets }: { sheets: SheetsResponse }) => {
  const { personal, group, archived } = useMemo(
    () => partitionSheets(sheets),
    [sheets],
  );

  const [showArchived, setShowArchived] = useState(false);

  return sheets.length === 0 ? (
    <Alert>
      <AlertTitle>No sheets</AlertTitle>
    </Alert>
  ) : (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
      {personal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Sheets</CardTitle>
          </CardHeader>
          <CardContent>
            {personal.map((sheet) => (
              <SheetItem key={sheet.id} sheet={sheet} />
            ))}
          </CardContent>
        </Card>
      )}

      {group.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Group Sheets</CardTitle>
          </CardHeader>
          <CardContent>
            {group.map((sheet) => (
              <SheetItem key={sheet.id} sheet={sheet} />
            ))}
          </CardContent>
        </Card>
      )}

      {archived.length > 0 && (
        <Card className={cn(showArchived ? '' : 'opacity-50')}>
          <Collapsible open={showArchived}>
            <CardHeader>
              <CardTitle className="flex place-items-center justify-between">
                Archived Sheets
                <CollapsibleTrigger asChild>
                  <ExpandMoreButton
                    expand={showArchived}
                    onClick={() => {
                      setShowArchived((prev) => !prev);
                    }}
                  />
                </CollapsibleTrigger>
              </CardTitle>
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
      )}
    </div>
  );
};
