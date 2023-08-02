import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { MdDeleteOutline, MdMoreVert } from 'react-icons/md';

import {
  type Money,
  type ExpenseSummaryResponse,
} from '@nihalgonsalves/expenses-backend';

import { trpc } from '../../api/trpc';
import { formatCurrency } from '../../utils/money';
import { clsxtw } from '../../utils/utils';
import { Avatar } from '../Avatar';
import { ParticipantListItem } from '../ParticipantListItem';

import { AddMemberButton } from './AddMemberButton';

const InfoMenuItem = ({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex flex-row justify-between">
    <div>{label}</div>
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
}: {
  groupSheetId: string;
  setIsInvalidating: (val: boolean) => void;
} & ExpenseSummaryResponse[number]) => {
  const { enqueueSnackbar } = useSnackbar();

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
    } catch (e) {
      enqueueSnackbar(
        `Error deleting expense: ${
          e instanceof TRPCClientError ? e.message : 'Unknown Error'
        }`,
        { variant: 'error' },
      );
    } finally {
      setIsInvalidating(false);
    }
  };

  return (
    <div className="dropdown dropdown-left">
      <button type="button" aria-label="more" aria-haspopup="true">
        <MdMoreVert />
      </button>
      <div className="text-content card dropdown-content card-bordered card-compact z-[1] w-64 bg-base-100 p-2 shadow">
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
          <div className="divider" />
          <button
            type="button"
            className="btn btn-error btn-outline"
            onClick={handleDelete}
          >
            <MdDeleteOutline />
            Delete Participant
          </button>
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
}: {
  summary: ExpenseSummaryResponse[number];
  groupSheetId: string;
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
        {...summary}
      />
    </ParticipantListItem>
  );
};

export const BalanceSummary = ({ groupSheetId }: { groupSheetId: string }) => {
  const { data: summaries } =
    trpc.expense.getParticipantSummaries.useQuery(groupSheetId);

  return (
    <div className="flex flex-col gap-4">
      {summaries?.map((summary) => (
        <SummaryCard
          key={summary.participantId}
          groupSheetId={groupSheetId}
          summary={summary}
        />
      ))}

      <AddMemberButton groupSheetId={groupSheetId} />
    </div>
  );
};
