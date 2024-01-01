import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { CaretSortIcon } from '@radix-ui/react-icons';

import { trpc } from '../../api/trpc';
import { formatCurrency } from '../../utils/money';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';

export const SettleUpView = ({ groupSheetId }: { groupSheetId: string }) => {
  const { data } =
    trpc.transaction.getSimplifiedBalances.useQuery(groupSheetId);

  return (
    <>
      {data?.byParticipant.map(({ id, name, otherParticipants }) => (
        <Collapsible key={id}>
          <div className="flex items-center justify-between space-x-4 px-4">
            <h4 className="text-sm font-semibold">
              {name} owes {otherParticipants.length} others
            </h4>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <AccessibleIcon label="Toggle">
                  <CaretSortIcon className="h-4 w-4" />
                </AccessibleIcon>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-2">
            {otherParticipants.map((o) => (
              <div
                className="flex justify-between rounded-md border px-4 py-2 font-mono text-sm shadow-sm"
                key={o.id}
              >
                <span>{o.name}</span>
                <Badge>{formatCurrency(o.balance)}</Badge>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </>
  );
};
