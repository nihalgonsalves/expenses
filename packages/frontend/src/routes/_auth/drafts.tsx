import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { TrashIcon } from "lucide-react";
import { z } from "zod";

import type { TransactionDraft } from "@nihalgonsalves/expenses-shared/types/transaction-draft";

import { useQueryClient } from "../../api/query-client";
import {
  transactionDraftMutations,
  transactionDraftQueries,
} from "../../api/transaction-draft.functions";
import { ChooseSheetDialog } from "../../components/expenses/choose-sheet-dialog";
import { DraftAmount } from "../../components/transaction-drafts/draft-summary";
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
  validateSearch: z.object({
    /** set by the new draft notification, see sw.ts */
    draftId: z.string().optional(),
  }),
  loaderDeps: ({ search: { draftId } }) => ({ draftId }),
  loader: async ({ context: { queryClient }, deps: { draftId } }) => {
    const drafts = await queryClient.query({
      ...transactionDraftQueries.drafts.queryOptions(),
      // the cached list may be from before the notification's draft was created
      staleTime: draftId ? 0 : "static",
    });

    if (!draftId) return { searchDraft: undefined };

    const searchDraft = drafts.find(({ id }) => id === draftId);

    if (!searchDraft) {
      // already added or discarded
      throw redirect({ to: "/drafts", search: {}, replace: true });
    }

    return { searchDraft };
  },
  component: RouteComponent,
});

const DraftCard = ({ draft }: { draft: TransactionDraft }) => {
  const { invalidate } = useQueryClient();
  const { mutateAsync: deleteTransactionDraft, isPending } = useMutation(
    transactionDraftMutations.deleteTransactionDraft(),
  );

  const onDiscard = async () => {
    try {
      await deleteTransactionDraft({ id: draft.id });
      haptics.success();
    } catch {
      // the error is already toasted by the global mutation `onError`
      haptics.error();
    } finally {
      // refetch even on failure, e.g. when the draft was already used elsewhere
      await invalidate(transactionDraftQueries.drafts.queryKey());
    }
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
          triggerType="trigger"
          render={<Button className="w-full">Add to sheet</Button>}
        />
      </CardFooter>
    </Card>
  );
};

function RouteComponent() {
  const { searchDraft } = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.fullPath });
  const result = useQuery(transactionDraftQueries.drafts.queryOptions());

  // closes by itself once the draft is used, as the list is then refetched
  const searchDraftOpen =
    searchDraft !== undefined &&
    (result.data?.some(({ id }) => id === searchDraft.id) ?? false);

  return (
    <>
      <ChooseSheetDialog
        draft={searchDraft}
        triggerType="controlled"
        open={searchDraftOpen}
        handleSetOpen={(open) => {
          if (!open) void navigate({ search: {}, replace: true });
        }}
      />
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
    </>
  );
}
