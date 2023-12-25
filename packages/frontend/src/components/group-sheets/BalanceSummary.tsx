import { DotsVerticalIcon, ExitIcon, TrashIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Money } from '@nihalgonsalves/expenses-shared/money';
import type { TransactionSummaryResponse } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { formatCurrency } from '../../utils/money';
import { clsxtw } from '../../utils/utils';
import { AvatarGroup } from '../Avatar';
import { Button } from '../form/Button';

import { ParticipantListItem } from './ParticipantListItem';

export type ActorInfo = { id: string; isAdmin: boolean };

const PersonMenu = ({
  groupSheetId,
  participantId,
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
        participantId,
      });

      await Promise.all([
        utils.sheet.groupSheetById.invalidate(groupSheetId),
        utils.transaction.getParticipantSummaries.invalidate(groupSheetId),
      ]);

      if (actorInfo.id === participantId) {
        navigate('/groups');
      }
    } catch {
      setIsInvalidating(false);
    }
  };

  const visible = actorInfo.isAdmin
    ? actorInfo.id !== participantId
    : actorInfo.id === participantId;

  if (!visible) {
    return null;
  }

  return (
    <div className="dropdown dropdown-left">
      <label
        tabIndex={0}
        className="btn btn-ghost"
        aria-label="more"
        aria-haspopup="true"
      >
        <DotsVerticalIcon />
      </label>
      <div
        tabIndex={0}
        className="text-content card dropdown-content card-bordered card-compact z-[1] w-72 bg-base-100 p-2 shadow"
      >
        <div className="card-body">
          <Button
            className="btn-error btn-outline"
            onClick={handleDelete}
            disabled={balance.amount !== 0 || !onLine}
          >
            {actorInfo.isAdmin ? (
              <>
                <TrashIcon /> Remove Participant
              </>
            ) : (
              <>
                <ExitIcon /> Leave
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
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
      className={clsxtw({
        'opacity-50': isInvalidating,
      })}
      avatar={<AvatarGroup names={[summary.name]} max={1} />}
    >
      <div className="flex flex-col">
        <span>
          <strong>{summary.name}</strong>
        </span>
        <span>{getBalanceText(summary.balance)}</span>
      </div>

      <div className="flex-grow" />
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
          key={summary.participantId}
          groupSheetId={groupSheetId}
          summary={summary}
          actorInfo={actorInfo}
        />
      ))}
    </div>
  );
};
