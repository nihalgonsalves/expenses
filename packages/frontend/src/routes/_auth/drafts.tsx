import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TrashIcon } from "lucide-react";

import type { TransactionDraft } from "@nihalgonsalves/expenses-shared/types/transaction-draft";

import { useQueryClient } from "../../api/query-client";
import {
  transactionDraftMutations,
  transactionDraftQueries,
} from "../../api/transaction-draft.functions";
import { CurrencySpan } from "../../components/currency-span";
import { ChooseSheetDialog } from "../../components/expenses/choose-sheet-dialog";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { RootLoader } from "../../pages/root";
import { formatDateTimeRelative } from "../../utils/temporal";
import { haptics } from "bzzz";

export const Route = createFileRoute("/_auth/drafts")({
  component: RouteComponent,
});

const DraftAmount = ({ money }: { money: TransactionDraft["money"] }) => {
  if (!money) return "Amount not recognised";

  const { amount, scale, currencyCode } = money;

  return currencyCode ? (
    <CurrencySpan money={{ amount, scale, currencyCode }} />
  ) : (
    (amount / Math.pow(10, scale)).toFixed(scale)
  );
};

const DraftCard = ({ draft }: { draft: TransactionDraft }) => {
  const { invalidate } = useQueryClient();
  const { mutateAsync: deleteTransactionDraft, isPending } = useMutation(
    transactionDraftMutations.deleteTransactionDraft(),
  );

  const onDiscard = async () => {
    await deleteTransactionDraft({ id: draft.id });
    haptics.success();
    await invalidate(transactionDraftQueries.drafts.queryKey());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{draft.description ?? "No description"}</CardTitle>
        <CardDescription>
          <DraftAmount money={draft.money} /> ·{" "}
          {formatDateTimeRelative(draft.spentAt)}
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Discard draft"
            isLoading={isPending}
            onClick={onDiscard}
          >
            <TrashIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardFooter>
        <ChooseSheetDialog
          draft={draft}
          render={<Button className="w-full">Add to sheet</Button>}
        />
      </CardFooter>
    </Card>
  );
};

function RouteComponent() {
  const result = useQuery(transactionDraftQueries.drafts.queryOptions());

  return (
    <RootLoader
      result={result}
      title="Drafts"
      render={(drafts) => (
        <div className="flex flex-col gap-4">
          {drafts.length === 0 && (
            <p className="text-muted-foreground text-center">No drafts</p>
          )}
          {drafts.map((draft) => (
            <DraftCard key={draft.id} draft={draft} />
          ))}
        </div>
      )}
    />
  );
}
