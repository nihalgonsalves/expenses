import { DotsVerticalIcon, ExitIcon, TrashIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Money } from '@nihalgonsalves/expenses-shared/money';
import type { TransactionSummaryResponse } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { formatCurrency } from '../../utils/money';
import { AvatarGroup } from '../Avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../ui/utils';

import { ParticipantListItem } from './ParticipantListItem';

export type ActorInfo = { id: string; isAdmin: boolean };

const PersonMenu = ({
  id,
  groupSheetId,
  balance,
  setIsInvalidating,
  actorInfo,
}: TransactionSummaryResponse[number] & {
  groupSheetId: string;
  setIsInvalidating: (val: boolean) => void;
  actorInfo: ActorInfo;
}) => {
  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();

  const utils = trpc.useUtils();
  const { mutateAsync: deleteGroupSheetMember } =
    trpc.sheet.deleteGroupSheetMember.useMutation();

  const handleDelete = async () => {
    setIsInvalidating(true);

    try {
      await deleteGroupSheetMember({
        groupSheetId,
        participantId: id,
      });

      await Promise.all([
        utils.sheet.groupSheetById.invalidate(groupSheetId),
        utils.transaction.getParticipantSummaries.invalidate(groupSheetId),
      ]);

      if (actorInfo.id === id) {
        navigate('/groups');
      }
    } catch {
      setIsInvalidating(false);
    }
  };

  const visible = actorInfo.isAdmin ? actorInfo.id !== id : actorInfo.id === id;

  if (!visible) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="bg-inherit">
          <DotsVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="left">
        <DropdownMenuItem
          onSelect={handleDelete}
          disabled={balance.amount !== 0 || !onLine}
        >
          {actorInfo.isAdmin ? (
            <>
              <TrashIcon className="mr-2" /> Remove Participant
            </>
          ) : (
            <>
              <ExitIcon className="mr-2" /> Leave
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const getBalanceText = (balance: Money) => {
  if (balance.amount === 0) {
    return 'Settled up';
  }

  const amount = formatCurrency(balance, {
    signDisplay: 'never',
  });

  if (balance.amount > 0) {
    return `owes ${amount}`;
  } else {
    return `is owed ${amount}`;
  }
};

const SummaryCard = ({
  summary,
  groupSheetId,
  actorInfo,
}: {
  summary: TransactionSummaryResponse[number];
  groupSheetId: string;
  actorInfo: ActorInfo;
}) => {
  const [isInvalidating, setIsInvalidating] = useState(false);

  return (
    <ParticipantListItem
      className={cn({
        'opacity-50': isInvalidating,
      })}
      avatar={<AvatarGroup users={[summary]} max={1} />}
    >
      <div className="flex flex-col">
        <span>
          <strong>{summary.name}</strong>
        </span>
        <span>{getBalanceText(summary.balance)}</span>
      </div>

      <div className="grow" />
      <PersonMenu
        groupSheetId={groupSheetId}
        setIsInvalidating={setIsInvalidating}
        actorInfo={actorInfo}
        {...summary}
      />
    </ParticipantListItem>
  );
};

export const BalanceSummary = ({
  groupSheetId,
  actorInfo,
}: {
  groupSheetId: string;
  actorInfo: ActorInfo;
}) => {
  const { data: summaries } =
    trpc.transaction.getParticipantSummaries.useQuery(groupSheetId);

  return (
    <div className="flex flex-col gap-4">
      {summaries?.map((summary) => (
        <SummaryCard
          key={summary.id}
          groupSheetId={groupSheetId}
          summary={summary}
          actorInfo={actorInfo}
        />
      ))}
    </div>
  );
};
