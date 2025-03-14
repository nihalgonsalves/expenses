import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import {
  CaretSortIcon,
  CheckIcon,
  DotsVerticalIcon,
  ExitIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import type { Money } from "@nihalgonsalves/expenses-shared/money";
import type {
  BalanceSimplificationResponse,
  TransactionSummaryResponse,
} from "@nihalgonsalves/expenses-shared/types/transaction";

import { useTRPC } from "../../api/trpc";
import { useNavigatorOnLine } from "../../state/useNavigatorOnLine";
import { Avatar } from "../Avatar";
import { CurrencySpan } from "../CurrencySpan";
import { ConfirmDialog } from "../form/ConfirmDialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../ui/utils";

import { ParticipantListItem } from "./ParticipantListItem";

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

  const { trpc, invalidate } = useTRPC();

  const { mutateAsync: deleteGroupSheetMember } = useMutation(
    trpc.sheet.deleteGroupSheetMember.mutationOptions(),
  );

  const handleDelete = async () => {
    setIsInvalidating(true);

    try {
      await deleteGroupSheetMember({
        groupSheetId,
        participantId: id,
      });

      await invalidate(
        trpc.sheet.groupSheetById.queryKey(groupSheetId),
        trpc.transaction.getParticipantSummaries.queryKey(groupSheetId),
        trpc.transaction.getSimplifiedBalances.queryKey(groupSheetId),
      );

      if (actorInfo.id === id) {
        await navigate({ to: "/groups" });
      }
    } catch {
      setIsInvalidating(false);
    }
  };

  const visible = actorInfo.isAdmin ? actorInfo.id !== id : actorInfo.id === id;

  if (!visible) {
    return (
      <Button $size="icon" $variant="outline" disabled>
        <DotsVerticalIcon />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button $size="icon" $variant="outline" className="bg-inherit">
          <AccessibleIcon label="Member actions">
            <DotsVerticalIcon />
          </AccessibleIcon>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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

const BalanceText = ({ balance }: { balance: Money }) => {
  if (balance.amount === 0) {
    return <Badge variant="outline">Settled up</Badge>;
  }

  const amount = <CurrencySpan money={balance} signDisplay="never" />;

  if (balance.amount > 0) {
    return (
      <Badge
        variant="outline"
        className="border-red-200 text-red-600 shadow-none"
      >
        {amount}
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="border-green-200 text-green-600 shadow-none"
      >
        {amount}
      </Badge>
    );
  }
};

const TransferItem = ({
  groupSheetId,
  summary,
  transfer: t,
}: {
  groupSheetId: string;
  transfer: BalanceSimplificationResponse[number];
  summary: TransactionSummaryResponse[number];
}) => {
  const { trpc, invalidate } = useTRPC();

  const { mutateAsync: createGroupSheetSettlement, isPending } = useMutation(
    trpc.transaction.createGroupSheetSettlement.mutationOptions(),
  );

  const handleSettleUp = async () => {
    await createGroupSheetSettlement({
      groupSheetId,
      fromId: t.from.id,
      toId: t.to.id,
      money: t.money,
    });

    await invalidate(
      trpc.transaction.getAllUserTransactions.queryKey(),
      trpc.transaction.getGroupSheetTransactions.queryKey({
        groupSheetId,
      }),
      trpc.transaction.getParticipantSummaries.queryKey(groupSheetId),
      trpc.transaction.getSimplifiedBalances.queryKey(groupSheetId),
    );
  };

  return (
    <div
      className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm shadow-xs"
      key={`${t.from.id}_${t.to.id}`}
    >
      <span>
        {t.from.name} owes {t.to.name}
      </span>
      <span className="grow" />
      <Badge
        className={cn(
          "py-2 shadow-none",
          summary.id === t.from.id
            ? "bg-red-100 text-red-800 hover:bg-red-100"
            : "bg-green-100 text-green-800 hover:bg-green-100",
        )}
      >
        <CurrencySpan money={t.money} />
      </Badge>
      <ConfirmDialog
        onConfirm={handleSettleUp}
        trigger={
          <Button isLoading={isPending} type="button" $variant="outline">
            <CheckIcon className="mr-2" /> Settled?
          </Button>
        }
        confirmLabel="Settle up"
        description={
          <>
            Log a transfer of{" "}
            <strong>
              <CurrencySpan money={t.money} />
            </strong>{" "}
            from <strong>{t.from.name}</strong> to <strong>{t.to.name}</strong>
          </>
        }
      />
    </div>
  );
};

const SummaryCard = ({
  summary,
  groupSheetId,
  actorInfo,
  transfers,
}: {
  summary: TransactionSummaryResponse[number];
  groupSheetId: string;
  actorInfo: ActorInfo;
  transfers: BalanceSimplificationResponse | undefined;
}) => {
  const [isInvalidating, setIsInvalidating] = useState(false);

  return (
    <Collapsible className="flex flex-col gap-4">
      <ParticipantListItem
        avatar={<Avatar name={summary.name} />}
        className={cn("flex grow flex-row", {
          "opacity-50": isInvalidating,
        })}
      >
        <div className="flex grow flex-col">
          <span className="font-semibold">{summary.name}</span>
          <span>
            <BalanceText balance={summary.balance} />
          </span>
        </div>
        <CollapsibleTrigger asChild disabled={transfers?.length === 0}>
          <Button $variant="ghost" $size="icon">
            {transfers?.length === 0 ? (
              <AccessibleIcon label="Settled up">
                <CheckIcon className="h-4 w-4" />
              </AccessibleIcon>
            ) : (
              <AccessibleIcon label="Toggle">
                <CaretSortIcon className="h-4 w-4" />
              </AccessibleIcon>
            )}
          </Button>
        </CollapsibleTrigger>

        <PersonMenu
          groupSheetId={groupSheetId}
          setIsInvalidating={setIsInvalidating}
          actorInfo={actorInfo}
          {...summary}
        />
      </ParticipantListItem>
      <CollapsibleContent className="space-y-2">
        {transfers
          ?.filter((t) => t.from.id === summary.id || t.to.id === summary.id)
          .map((t) => (
            <TransferItem
              key={`${t.from.id}_${t.to.id}`}
              groupSheetId={groupSheetId}
              transfer={t}
              summary={summary}
            />
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const BalanceSummary = ({
  groupSheetId,
  actorInfo,
}: {
  groupSheetId: string;
  actorInfo: ActorInfo;
}) => {
  const { trpc } = useTRPC();

  const { data: summaries } = useQuery(
    trpc.transaction.getParticipantSummaries.queryOptions(groupSheetId),
  );

  const { data: transfers } = useQuery(
    trpc.transaction.getSimplifiedBalances.queryOptions(groupSheetId),
  );

  return (
    <div className="flex flex-col gap-4">
      {summaries?.map((summary) => (
        <SummaryCard
          key={summary.id}
          groupSheetId={groupSheetId}
          summary={summary}
          actorInfo={actorInfo}
          transfers={transfers}
        />
      ))}
    </div>
  );
};
