import { useState } from 'react';
import { MdDeleteOutline, MdMoreVert } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import type {
  Money,
  ExpenseSummaryResponse,
} from '@nihalgonsalves/expenses-backend';

import { trpc } from '../../api/trpc';
import { formatCurrency } from '../../utils/money';
import { clsxtw } from '../../utils/utils';
import { Avatar } from '../Avatar';
import { Button } from '../form/Button';

import { AddMemberButton } from './AddMemberButton';
import { ParticipantListItem } from './ParticipantListItem';

export type ActorInfo = { id: string; isAdmin: boolean };

const InfoMenuItem = ({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex flex-row justify-between">
    <div className="font-semibold">{label}</div>
    <div>{children}</div>
  </div>
);

const PersonMenu = ({
  groupSheetId,
  participantId,
  balance,
  spent,
  cost,
  sent,
  received,
  setIsInvalidating,
  actorInfo,
}: ExpenseSummaryResponse[number] & {
  groupSheetId: string;
  setIsInvalidating: (val: boolean) => void;
  actorInfo: ActorInfo;
}) => {
  const navigate = useNavigate();

  const utils = trpc.useContext();
  const { mutateAsync: deleteGroupSheetMember } =
    trpc.sheet.deleteGroupSheetMember.useMutation();

  const handleDelete = async () => {
    setIsInvalidating(true);

    try {
      await deleteGroupSheetMember({
        groupSheetId: groupSheetId,
        participantId,
      });

      await Promise.all([
        utils.sheet.groupSheetById.invalidate(groupSheetId),
        utils.expense.getParticipantSummaries.invalidate(groupSheetId),
      ]);

      if (actorInfo.id === participantId) {
        navigate('/groups');
      }
    } catch {
      setIsInvalidating(false);
    }
  };

  return (
    <div className="dropdown dropdown-left">
      <label
        tabIndex={0}
        className="btn btn-ghost"
        aria-label="more"
        aria-haspopup="true"
      >
        <MdMoreVert />
      </label>
      <div
        tabIndex={0}
        className="text-content card dropdown-content card-bordered card-compact z-[1] w-72 bg-base-100 p-2 shadow"
      >
        <div className="card-body">
          <InfoMenuItem label="Spent for group">
            {formatCurrency(spent)}
          </InfoMenuItem>
          <InfoMenuItem label="Cost to group">
            {formatCurrency(cost)}
          </InfoMenuItem>
          <InfoMenuItem label="Sent">{formatCurrency(sent)}</InfoMenuItem>
          <InfoMenuItem label="Received">
            {formatCurrency(received)}
          </InfoMenuItem>
          <InfoMenuItem label="=">{formatCurrency(balance)}</InfoMenuItem>
          {actorInfo.isAdmin && actorInfo.id !== participantId && (
            <>
              <div className="divider" />
              <Button
                className="btn-error btn-outline"
                onClick={handleDelete}
                disabled={balance.amount !== 0}
              >
                <MdDeleteOutline />
                Remove Participant
              </Button>
            </>
          )}
          {!actorInfo.isAdmin && actorInfo.id === participantId && (
            <>
              <div className="divider" />
              <Button
                className="btn-error btn-outline"
                onClick={handleDelete}
                disabled={balance.amount !== 0}
              >
                <MdDeleteOutline />
                Leave
              </Button>
            </>
          )}
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
  summary: ExpenseSummaryResponse[number];
  groupSheetId: string;
  actorInfo: ActorInfo;
}) => {
  const [isInvalidating, setIsInvalidating] = useState(false);

  return (
    <ParticipantListItem
      className={clsxtw({
        'opacity-50': isInvalidating,
      })}
      avatar={<Avatar name={summary.name} />}
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
    trpc.expense.getParticipantSummaries.useQuery(groupSheetId);

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

      {actorInfo.isAdmin && <AddMemberButton groupSheetId={groupSheetId} />}
    </div>
  );
};
